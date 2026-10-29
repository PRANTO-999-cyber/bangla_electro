import 'dotenv/config';
const configuredJwtAccessSecret = process.env.JWT_ACCESS_SECRET?.trim();
const jwtAccessSecret = configuredJwtAccessSecret || 'dev-access-secret';
const sslcommerzStoreId = process.env.SSLCOMMERZ_STORE_ID ?? '';
const sslcommerzStorePassword = process.env.SSLCOMMERZ_STORE_PASSWORD ?? '';
const apiPublicUrl = (process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(/\/+$/, '');
const hasAdminEmail = Boolean(process.env.ADMIN_EMAIL?.trim());
const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
if (hasAdminEmail !== hasAdminPassword) {
  throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both blank');
}
if ((hasAdminEmail || hasAdminPassword) && !configuredJwtAccessSecret) {
  throw new Error('JWT_ACCESS_SECRET must be set when provisioning the administrator account');
}
if (process.env.NODE_ENV === 'production' && (jwtAccessSecret.length < 32 || jwtAccessSecret === 'dev-access-secret')) {
  throw new Error('JWT_ACCESS_SECRET must be set to a random value of at least 32 characters in production');
}
if (process.env.NODE_ENV === 'production' && (sslcommerzStoreId || sslcommerzStorePassword)
  && (!sslcommerzStoreId || !sslcommerzStorePassword || !apiPublicUrl.startsWith('https://'))) {
  throw new Error('Production SSLCommerz requires both store credentials and an HTTPS API_PUBLIC_URL');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/electronics_store',
  jwtAccessSecret,
  googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? '',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  adminUrl: process.env.ADMIN_URL ?? 'http://localhost:5174',
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  sslcommerzStoreId,
  sslcommerzStorePassword,
  sslcommerzSandbox: (process.env.SSLCOMMERZ_SANDBOX ?? 'true').toLowerCase() !== 'false',
  apiPublicUrl,
  refreshTokenTtlDays: 30,
};
