import assert from 'node:assert/strict';
import { test } from 'node:test';
import Order from '../../src/models/Order.js';
import Product from '../../src/models/Product.js';
import Review from '../../src/models/Review.js';
import User from '../../src/models/User.js';
import NewsletterSubscriber from '../../src/models/NewsletterSubscriber.js';

function hasIndex(model, expected) {
  return model.schema.indexes().some(([fields]) =>
    Object.entries(expected).every(([field, direction]) => fields[field] === direction),
  );
}

test('catalog queries have indexes for default, category, brand, and stock sorts', () => {
  assert.equal(hasIndex(Product, { isActive: 1, featured: -1, createdAt: -1, _id: -1 }), true);
  assert.equal(hasIndex(Product, { isActive: 1, category: 1, featured: -1, createdAt: -1, _id: -1 }), true);
  assert.equal(hasIndex(Product, { isActive: 1, brand: 1, featured: -1, createdAt: -1, _id: -1 }), true);
  assert.equal(hasIndex(Product, { isActive: 1, stock: 1, _id: 1 }), true);
});

test('order and review histories have indexes for their filtered chronological queries', () => {
  assert.equal(hasIndex(Order, { user: 1, createdAt: -1, _id: -1 }), true);
  assert.equal(hasIndex(Order, { paymentStatus: 1, stockReserved: 1, stockReservedUntil: 1 }), true);
  assert.equal(hasIndex(Review, { product: 1, approved: 1, createdAt: -1 }), true);
  assert.equal(hasIndex(User, { role: 1, createdAt: -1, _id: -1 }), true);
});

test('newsletter subscriptions enforce unique email and support status-based admin lists', () => {
  assert.equal(hasIndex(NewsletterSubscriber, { email: 1 }), true);
  assert.equal(hasIndex(NewsletterSubscriber, { status: 1, subscribedAt: -1, _id: -1 }), true);
});
