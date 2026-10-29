import { env } from '../../config/env.js';

const sandboxBase = 'https://sandbox.sslcommerz.com';
const liveBase = 'https://securepay.sslcommerz.com';

function providerUrl(path) {
  const base = env.sslcommerzSandbox ? sandboxBase : liveBase;
  return new URL(path, base);
}

function requireCredentials() {
  if (!env.sslcommerzStoreId || !env.sslcommerzStorePassword) {
    throw new Error('SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD.');
  }
}

async function providerRequest(path, fields) {
  requireCredentials();
  const response = await fetch(providerUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`SSLCommerz returned HTTP ${response.status}`);
  const result = await response.json();
  if (!result || typeof result !== 'object') throw new Error('SSLCommerz returned an invalid response');
  return result;
}

function credentials() {
  return { store_id: env.sslcommerzStoreId, store_passwd: env.sslcommerzStorePassword };
}

export async function createSslSession(fields) {
  return providerRequest('/gwprocess/v4/api.php', { ...credentials(), ...fields });
}

export async function validateSslTransaction(validationId) {
  return providerRequest('/validator/api/validationserverAPI.php', {
    ...credentials(),
    val_id: validationId,
    format: 'json',
  });
}

export function isTrustedSslGatewayUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    const trustedHost = env.sslcommerzSandbox
      ? url.hostname === 'sandbox.sslcommerz.com'
      : url.hostname === 'securepay.sslcommerz.com';
    return url.protocol === 'https:' && trustedHost && !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

export function isValidSslTransaction(result, payment) {
  if (!result || !['VALID', 'VALIDATED'].includes(String(result.status).toUpperCase())) return false;
  if (result.tran_id !== payment.transactionId || result.currency !== payment.currency) return false;
  if (result.store_id !== env.sslcommerzStoreId) return false;
  const amount = Number(result.amount);
  return Number.isFinite(amount) && Math.round(amount * 100) === Math.round(payment.amount * 100);
}

export function sslcommerzIsConfigured() {
  return Boolean(env.sslcommerzStoreId && env.sslcommerzStorePassword);
}
