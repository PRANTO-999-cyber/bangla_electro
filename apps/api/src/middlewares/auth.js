import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { env } from '../config/env.js';

export async function requireAuth(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ success: false, message: 'Authentication required' });

  let claims;
  try {
    claims = jwt.verify(match[1], env.jwtAccessSecret);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    throw error;
  }

  if (typeof claims === 'string' || !mongoose.isValidObjectId(claims.sub)) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  const user = await User.findById(claims.sub).select('-password');
  if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid account' });
  if (claims.version !== (user.tokenVersion || 0)) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
  req.user = user;
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  return next();
}
