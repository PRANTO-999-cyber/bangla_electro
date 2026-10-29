import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import RefreshToken from '../models/RefreshToken.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/response.js';

const accessToken = (user) => jwt.sign(
  { sub: user._id.toString(), role: user.role, version: user.tokenVersion || 0 },
  env.jwtAccessSecret,
  { expiresIn: '15m' },
);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const refreshCookie = 'electrostore_refresh';
const googleClient = new OAuth2Client();
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/api/v1/auth',
};

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readRefreshCookie(req) {
  const header = req.headers.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0 || part.slice(0, separator).trim() !== refreshCookie) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return '';
    }
  }
  return '';
}

async function issueSession(user, res) {
  const rawRefreshToken = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(rawRefreshToken),
    tokenVersion: user.tokenVersion || 0,
    expiresAt,
  });
  res.cookie(refreshCookie, rawRefreshToken, {
    ...refreshCookieOptions,
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
  return { user: publicUser(user), accessToken: accessToken(user) };
}

function clearRefreshCookie(res) {
  res.clearCookie(refreshCookie, refreshCookieOptions);
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export async function register(req, res) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return fail(res, 'A valid name, email, and password (8-128 characters) are required');
  }

  if (await User.exists({ email })) return fail(res, 'Email already registered', 409);
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  return ok(res, await issueSession(user, res), 'Registration successful', 201);
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;
  if (!email || typeof password !== 'string' || password.length > 128) return fail(res, 'Invalid email or password', 401);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
    return fail(res, 'Invalid email or password', 401);
  }
  user.lastLoginAt = new Date();
  await user.save();
  return ok(res, await issueSession(user, res), 'Login successful');
}

export async function googleLogin(req, res) {
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || !credential || credential.length > 8192) {
    return fail(res, 'A valid Google credential is required', 400);
  }
  if (!env.googleClientId) return fail(res, 'Google sign-in is not configured on the server', 503);

  let profile;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.googleClientId,
    });
    profile = ticket.getPayload();
  } catch {
    return fail(res, 'Google credential could not be verified', 401);
  }
  if (typeof profile?.sub !== 'string' || typeof profile.email !== 'string'
    || profile.email_verified !== true) {
    return fail(res, 'Google must provide a verified email address', 401);
  }

  const email = normalizeEmail(profile.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(res, 'Google must provide a valid email address', 401);
  }
  let user = await User.findOne({ email });
  if (!user) {
    try {
      user = await User.create({
        name: typeof profile.name === 'string' && profile.name.trim()
          ? profile.name.trim().slice(0, 100)
          : email.split('@')[0],
        email,
        password: await bcrypt.hash(randomBytes(32).toString('base64url'), 12),
        isVerified: true,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      user = await User.findOne({ email });
      if (!user) throw error;
    }
  }
  if (!user.isActive) return fail(res, 'This account is inactive', 403);
  if (user.role !== 'customer') return fail(res, 'Use administrator credentials to access this account', 403);

  user.isVerified = true;
  user.lastLoginAt = new Date();
  await user.save();
  return ok(res, await issueSession(user, res), 'Google sign-in successful');
}

export async function refresh(req, res) {
  const rawToken = readRefreshCookie(req);
  if (!rawToken) return fail(res, 'Refresh token required', 401);

  const refreshToken = await RefreshToken.findOneAndDelete({
    tokenHash: hashToken(rawToken),
    expiresAt: { $gt: new Date() },
  });
  if (!refreshToken) {
    clearRefreshCookie(res);
    return fail(res, 'Invalid or expired refresh token', 401);
  }

  const user = await User.findById(refreshToken.user).select('-password');
  if (!user || !user.isActive || refreshToken.tokenVersion !== (user.tokenVersion || 0)) {
    clearRefreshCookie(res);
    return fail(res, 'Invalid account session', 401);
  }
  return ok(res, await issueSession(user, res), 'Session refreshed');
}

export async function me(req, res) {
  return ok(res, { user: publicUser(req.user) });
}

export async function logout(req, res) {
  const rawToken = readRefreshCookie(req);
  if (rawToken) await RefreshToken.deleteOne({ user: req.user._id, tokenHash: hashToken(rawToken) });
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  await RefreshToken.deleteMany({ user: req.user._id });
  clearRefreshCookie(res);
  return ok(res, {}, 'Logged out');
}
