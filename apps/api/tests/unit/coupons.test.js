import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateCouponDiscount } from '../../src/services/coupons.js';

const items = [
  { product: 'product-a', category: 'category-a', totalPrice: 1200 },
  { product: 'product-b', category: 'category-b', totalPrice: 800 },
];

test('percentage coupon discounts eligible items and honors its maximum discount', () => {
  const coupon = {
    isActive: true,
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 250,
  };

  assert.equal(calculateCouponDiscount(coupon, items, 2000), 250);
  assert.throws(
    () => calculateCouponDiscount({ ...coupon, discountValue: 101 }, items, 2000),
    /cannot exceed 100%/,
  );
});

test('fixed coupon discount is capped at the eligible item total', () => {
  const coupon = {
    isActive: true,
    discountType: 'fixed',
    discountValue: 1000,
    applicableProducts: ['product-a'],
  };

  assert.equal(calculateCouponDiscount(coupon, items, 2000), 1000);
  assert.equal(calculateCouponDiscount(
    { ...coupon, discountValue: 5000 },
    items,
    2000,
  ), 1200);
});

test('coupon applies to matching products or categories only', () => {
  const coupon = {
    isActive: true,
    discountType: 'percentage',
    discountValue: 50,
    applicableProducts: ['product-a'],
    applicableCategories: ['category-b'],
  };

  assert.equal(calculateCouponDiscount(coupon, items, 2000), 1000);
  assert.throws(
    () => calculateCouponDiscount({
      ...coupon,
      applicableProducts: ['missing'],
      applicableCategories: ['missing'],
    }, items, 2000),
    /does not apply/,
  );
});

test('coupon rejects inactive, not-yet-active, expired, or under-minimum orders', () => {
  const coupon = { isActive: true, discountType: 'fixed', discountValue: 100 };
  const now = new Date('2026-10-21T12:00:00.000Z');

  assert.throws(() => calculateCouponDiscount({ ...coupon, isActive: false }, items, 2000, { now }), /not available/);
  assert.throws(() => calculateCouponDiscount({ ...coupon, startsAt: '2026-10-22' }, items, 2000, { now }), /not active yet/);
  assert.throws(() => calculateCouponDiscount({ ...coupon, endsAt: '2026-10-20' }, items, 2000, { now }), /expired/);
  assert.throws(() => calculateCouponDiscount({ ...coupon, minOrderValue: 2500 }, items, 2000, { now }), /minimum order/);
});

test('coupon enforces overall and per-user limits', () => {
  const coupon = {
    isActive: true,
    discountType: 'fixed',
    discountValue: 100,
    usageLimit: 2,
    perUserLimit: 1,
  };

  assert.throws(() => calculateCouponDiscount(coupon, items, 2000, { usageCount: 2 }), /usage limit/);
  assert.throws(() => calculateCouponDiscount(coupon, items, 2000, { userUsageCount: 1 }), /usage limit/);
});
