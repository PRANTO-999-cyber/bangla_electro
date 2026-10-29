import assert from 'node:assert/strict';
import { test } from 'node:test';
import { env } from '../../src/config/env.js';
import { isTrustedSslGatewayUrl, isValidSslTransaction } from '../../src/integrations/payment/sslcommerz.js';

const payment = { transactionId: 'ES123abc', amount: 1250, currency: 'BDT' };
const validResponse = {
  status: 'VALID',
  tran_id: payment.transactionId,
  amount: '1250.00',
  currency: payment.currency,
  store_id: env.sslcommerzStoreId,
};

test('SSLCommerz validation requires a valid transaction with matching amount and currency', () => {
  assert.equal(isValidSslTransaction(validResponse, payment), true);
  assert.equal(isValidSslTransaction({ ...validResponse, amount: '1250.01' }, payment), false);
  assert.equal(isValidSslTransaction({ ...validResponse, currency: 'USD' }, payment), false);
  assert.equal(isValidSslTransaction({ ...validResponse, tran_id: 'another-transaction' }, payment), false);
  assert.equal(isValidSslTransaction({ ...validResponse, status: 'FAILED' }, payment), false);
});

test('SSLCommerz checkout redirects reject untrusted hosts and insecure URLs', () => {
  assert.equal(isTrustedSslGatewayUrl('https://example.com/checkout'), false);
  assert.equal(isTrustedSslGatewayUrl('http://sandbox.sslcommerz.com/checkout'), false);
  assert.equal(isTrustedSslGatewayUrl('https://user@sandbox.sslcommerz.com/checkout'), false);
  assert.equal(isTrustedSslGatewayUrl('javascript:alert(1)'), false);
});
