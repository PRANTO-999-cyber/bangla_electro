import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import Inventory from '../models/Inventory.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import { createSslSession, isTrustedSslGatewayUrl, isValidSslTransaction, sslcommerzIsConfigured, validateSslTransaction } from '../integrations/payment/sslcommerz.js';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/response.js';
import { calculateCouponDiscount } from '../services/coupons.js';

const reservationMs = 20 * 60 * 1000;

function safeStorefrontRedirect(res, transactionId, status) {
  const url = new URL('/payment/result', `${env.clientUrl}/`);
  if (transactionId) url.searchParams.set('tran_id', transactionId);
  url.searchParams.set('status', status);
  return res.redirect(303, url.toString());
}

function callbackValue(req, key) {
  const value = req.body?.[key] ?? req.query?.[key];
  return typeof value === 'string' ? value : '';
}

function positiveInteger(value) {
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= 10;
}

async function restoreStock(items, note, userId) {
  for (const item of items) {
    const product = await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }, { new: true });
    if (!product) throw new Error(`Cannot restore reserved stock for missing product ${item.product}`);
    await Inventory.create({
      product: item.product,
      movementType: 'payment-release',
      quantity: item.quantity,
      previousStock: product.stock - item.quantity,
      newStock: product.stock,
      note,
      createdBy: userId,
    });
  }
}

async function releaseOrder(orderId, paymentStatus, orderStatus, reason) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'pending', stockReserved: true },
    { $set: { paymentStatus, orderStatus, stockReserved: false } },
    { new: true },
  );
  if (!order) return null;
  await restoreStock(order.items, reason, order.user);
  return order;
}

async function releaseProviderReservation(transactionId, paymentStatus, reason) {
  if (!transactionId) return;
  const payment = await Payment.findOneAndUpdate(
    { transactionId, provider: 'sslcommerz', status: 'pending' },
    { $set: { status: paymentStatus } },
    { new: true },
  );
  if (!payment) return;
  await releaseOrder(payment.order, paymentStatus, 'cancelled', reason);
}

async function reserveStock(requestedItems) {
  const reserved = [];
  try {
    for (const item of requestedItems) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, $expr: { $gte: [{ $ifNull: ['$stock', 0] }, item.quantity] } },
        { $inc: { stock: -item.quantity } },
        { new: true, runValidators: true },
      );
      if (!product) throw new Error(`${item.productName} does not have enough stock.`);
      reserved.push({
        product: item.product,
        quantity: item.quantity,
        previousStock: product.stock + item.quantity,
        newStock: product.stock,
      });
    }
    return reserved;
  } catch (error) {
    if (reserved.length) await restoreStock(reserved, 'Checkout reservation rollback', null);
    throw error;
  }
}

function findProductsForCart(items) {
  const ids = items.filter((item) => mongoose.isValidObjectId(item.productId)).map((item) => item.productId);
  const slugs = items.filter((item) => typeof item.productId === 'string' && !mongoose.isValidObjectId(item.productId)).map((item) => item.productId);
  const alternatives = [];
  if (ids.length) alternatives.push({ _id: { $in: ids } });
  if (slugs.length) alternatives.push({ slug: { $in: slugs } });
  return Product.find({ isActive: true, $or: alternatives });
}

async function handleValidatedPayment(payment, validation, validationId) {
  const claimed = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $in: ['pending', 'expired', 'failed', 'cancelled'] } },
    { $set: { status: 'verifying', validationId } },
    { new: true },
  );
  if (!claimed) return Payment.findById(payment._id);

  if (!isValidSslTransaction(validation, claimed)) {
    await Payment.updateOne({ _id: claimed._id, status: 'verifying' }, { $set: { status: 'failed' } });
    await releaseOrder(claimed.order, 'failed', 'cancelled', 'SSLCommerz payment verification failed');
    return Payment.findById(claimed._id);
  }

  const order = await Order.findOneAndUpdate(
    { _id: claimed.order, paymentStatus: 'pending', stockReserved: true, stockReservedUntil: { $gt: new Date() } },
    { $set: { paymentStatus: 'paid', orderStatus: 'processing', stockReserved: false } },
    { new: true },
  );
  if (!order) {
    const fulfillmentHold = await Order.findOneAndUpdate(
      { _id: claimed.order, paymentStatus: { $in: ['pending', 'expired', 'failed', 'cancelled'] } },
      { $set: { paymentStatus: 'paid', orderStatus: 'on-hold', stockReserved: false } },
      { new: true },
    );
    if (fulfillmentHold) {
      await Payment.updateOne(
        { _id: claimed._id, status: 'verifying' },
        { $set: { status: 'paid', paidAt: new Date(), metadata: { fulfillmentHold: true, bankTransactionId: validation.bank_tran_id || '' } } },
      );
      return Payment.findById(claimed._id);
    }
    await Payment.updateOne({ _id: claimed._id, status: 'verifying' }, { $set: { status: 'expired' } });
    return Payment.findById(claimed._id);
  }

  await Payment.updateOne(
    { _id: claimed._id, status: 'verifying' },
    { $set: { status: 'paid', paidAt: new Date(), metadata: { bankTransactionId: validation.bank_tran_id || '' } } },
  );
  return Payment.findById(claimed._id);
}

export async function createSslCommerzPayment(req, res) {
  if (!sslcommerzIsConfigured()) return fail(res, 'SSLCommerz payment is not configured', 503);
  const rawItems = req.body?.items;
  const address = req.body?.shippingAddress;
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 30) {
    return fail(res, 'Provide between 1 and 30 cart items', 400);
  }
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    return fail(res, 'Shipping address is required', 400);
  }
  const customerName = typeof address.name === 'string' ? address.name.trim().slice(0, 100) : req.user.name;
  const phone = typeof address.phone === 'string' ? address.phone.trim().slice(0, 30) : '';
  const addressLine = typeof address.addressLine1 === 'string' ? address.addressLine1.trim().slice(0, 200) : '';
  const city = typeof address.city === 'string' ? address.city.trim().slice(0, 100) : '';
  const postalCode = typeof address.postalCode === 'string' ? address.postalCode.trim().slice(0, 20) : '1000';
  if (!customerName || !phone || !addressLine || !city) return fail(res, 'Name, phone, city, and address are required', 400);

  const aggregated = new Map();
  for (const item of rawItems) {
    if (!item || typeof item.productId !== 'string' || !positiveInteger(item.quantity)) {
      return fail(res, 'Each cart item needs a productId and a quantity from 1 to 10', 400);
    }
    aggregated.set(item.productId, (aggregated.get(item.productId) || 0) + item.quantity);
  }
  if ([...aggregated.values()].some((quantity) => quantity > 10)) return fail(res, 'Maximum quantity is 10 per product', 400);
  const normalizedItems = [...aggregated].map(([productId, quantity]) => ({ productId, quantity }));
  const products = await findProductsForCart(normalizedItems);
  const productsByIdentity = new Map();
  for (const product of products) {
    productsByIdentity.set(product._id.toString(), product);
    productsByIdentity.set(product.slug, product);
  }

  const orderItems = [];
  for (const item of normalizedItems) {
    const product = productsByIdentity.get(item.productId);
    if (!product) return fail(res, 'A cart item is unavailable. Refresh your cart and try again.', 400);
    if (!Number.isFinite(product.basePrice) || product.basePrice < 0) return fail(res, `${product.name} has no valid price`, 400);
    orderItems.push({
      product: product._id,
      productName: product.name,
      sku: product.sku,
      image: product.images?.[0] || '',
      quantity: item.quantity,
      unitPrice: product.basePrice,
      totalPrice: product.basePrice * item.quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  let discount = 0;
  let appliedCoupon;
  const couponCode = typeof req.body?.couponCode === 'string'
    ? req.body.couponCode.trim().toUpperCase().slice(0, 64)
    : '';
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) return fail(res, 'Coupon code was not found', 400);

    const activeCouponOrders = {
      'coupon.code': coupon.code,
      $or: [
        { paymentStatus: 'paid' },
        { paymentStatus: 'pending', stockReserved: true, stockReservedUntil: { $gt: new Date() } },
      ],
    };
    const [usageCount, userUsageCount] = await Promise.all([
      coupon.usageLimit > 0
        ? Order.countDocuments(activeCouponOrders)
        : 0,
      coupon.perUserLimit > 0
        ? Order.countDocuments({ ...activeCouponOrders, user: req.user._id })
        : 0,
    ]);
    try {
      discount = calculateCouponDiscount(coupon, orderItems.map((item) => ({
        ...item,
        category: productsByIdentity.get(item.product.toString())?.category,
      })), subtotal, { usageCount, userUsageCount });
    } catch (error) {
      return fail(res, error.message, 400);
    }
    appliedCoupon = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: discount,
    };
  }
  const shippingCost = subtotal >= 5000 ? 0 : 150;
  const total = Number((subtotal - discount + shippingCost).toFixed(2));
  if (!Number.isFinite(total) || total <= 0) return fail(res, 'Order total must be greater than zero', 400);

  let reserved;
  try {
    reserved = await reserveStock(orderItems);
  } catch (error) {
    if (error.message.includes('does not have enough stock')) return fail(res, error.message, 409);
    throw error;
  }

  let order;
  let payment;
  try {
    const expiresAt = new Date(Date.now() + reservationMs);
    order = await Order.create({
      orderNumber: `ES-${Date.now()}-${randomBytes(4).toString('hex')}`,
      user: req.user._id,
      items: orderItems,
      shippingAddress: {
        name: customerName,
        phone,
        addressLine1: addressLine,
        city,
        postalCode,
        country: 'Bangladesh',
      },
      subtotal,
      discount,
      shippingCost,
      tax: 0,
      total,
      coupon: appliedCoupon,
      paymentMethod: 'sslcommerz',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      stockReserved: true,
      stockReservedUntil: expiresAt,
    });
    payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      provider: 'sslcommerz',
      transactionId: `ES${Date.now()}${randomBytes(8).toString('hex')}`,
      amount: total,
      currency: 'BDT',
      status: 'pending',
    });
    const callbackRoot = `${env.apiPublicUrl}/api/v1/payments/sslcommerz`;
    const providerResponse = await createSslSession({
      total_amount: total.toFixed(2),
      currency: 'BDT',
      tran_id: payment.transactionId,
      success_url: `${callbackRoot}/success`,
      fail_url: `${callbackRoot}/fail`,
      cancel_url: `${callbackRoot}/cancel`,
      ipn_url: `${callbackRoot}/ipn`,
      shipping_method: 'Courier',
      product_name: orderItems.slice(0, 3).map((item) => item.productName).join(', ').slice(0, 250),
      product_category: 'Electronics',
      product_profile: 'physical-goods',
      cus_name: customerName,
      cus_email: req.user.email,
      cus_add1: addressLine,
      cus_city: city,
      cus_postcode: postalCode,
      cus_country: 'Bangladesh',
      cus_phone: phone,
      ship_name: customerName,
      ship_add1: addressLine,
      ship_city: city,
      ship_postcode: postalCode,
      ship_country: 'Bangladesh',
    });
    if (providerResponse.status !== 'SUCCESS' || !isTrustedSslGatewayUrl(providerResponse.GatewayPageURL)) {
      throw new Error('SSLCommerz did not provide a trusted checkout URL');
    }
    payment.sessionKey = providerResponse.sessionkey;
    await payment.save();
    await Promise.all(reserved.map((item) => Inventory.create({
      product: item.product,
      movementType: 'order-reservation',
      quantity: item.quantity,
      previousStock: item.previousStock,
      newStock: item.newStock,
      note: `Reserved for order ${order.orderNumber}`,
      createdBy: req.user._id,
    })));
    return ok(res, {
      paymentUrl: providerResponse.GatewayPageURL,
      transactionId: payment.transactionId,
      orderNumber: order.orderNumber,
      expiresAt: order.stockReservedUntil,
    }, 'Payment session created', 201);
  } catch (error) {
    if (order) {
      await releaseOrder(order._id, 'failed', 'cancelled', 'Payment session could not be started');
    } else if (reserved?.length) {
      await restoreStock(reserved, 'Payment session creation rollback', req.user._id);
    }
    if (payment) await Payment.updateOne({ _id: payment._id, status: 'pending' }, { $set: { status: 'failed' } });
    console.error('SSLCommerz session creation failed', { message: error.message });
    return fail(res, 'Could not start a secure payment session. Please try again.', 502);
  }
}

async function processProviderCallback(req, res, { ipn = false } = {}) {
  const transactionId = callbackValue(req, 'tran_id');
  const validationId = callbackValue(req, 'val_id');
  if (!transactionId) {
    return ipn ? fail(res, 'Transaction id is required', 400) : safeStorefrontRedirect(res, '', 'invalid');
  }
  const payment = await Payment.findOne({ transactionId, provider: 'sslcommerz' });
  if (!payment) return ipn ? fail(res, 'Payment not found', 404) : safeStorefrontRedirect(res, transactionId, 'not_found');
  if (payment.status === 'paid') return ipn ? ok(res, {}, 'Payment already confirmed') : safeStorefrontRedirect(res, transactionId, 'success');
  if (!['pending', 'expired', 'failed', 'cancelled'].includes(payment.status)) {
    return ipn ? ok(res, {}, 'Payment is already being processed') : safeStorefrontRedirect(res, transactionId, payment.status);
  }
  if (!validationId) return ipn ? fail(res, 'Validation id is required', 400) : safeStorefrontRedirect(res, transactionId, 'pending');

  let validation;
  try {
    validation = await validateSslTransaction(validationId);
  } catch (error) {
    console.error('SSLCommerz transaction validation failed', { message: error.message });
    return ipn ? fail(res, 'Payment verification is temporarily unavailable', 503) : safeStorefrontRedirect(res, transactionId, 'pending');
  }
  if (!isValidSslTransaction(validation, payment)) {
    return ipn ? fail(res, 'Payment verification failed', 400) : safeStorefrontRedirect(res, transactionId, 'failed');
  }
  const result = await handleValidatedPayment(payment, validation, validationId);
  if (ipn) return ok(res, {}, result?.status === 'paid' ? 'Payment confirmed' : 'Payment could not be completed');
  return safeStorefrontRedirect(res, transactionId, result?.status === 'paid' ? 'success' : result?.status || 'pending');
}

export async function sslCommerzSuccess(req, res) {
  return processProviderCallback(req, res);
}

export async function sslCommerzIpn(req, res) {
  return processProviderCallback(req, res, { ipn: true });
}

export async function sslCommerzFailure(req, res) {
  const transactionId = callbackValue(req, 'tran_id');
  await releaseProviderReservation(transactionId, 'failed', 'SSLCommerz payment failed');
  return safeStorefrontRedirect(res, transactionId, 'failed');
}

export async function sslCommerzCancel(req, res) {
  const transactionId = callbackValue(req, 'tran_id');
  await releaseProviderReservation(transactionId, 'cancelled', 'Customer cancelled SSLCommerz payment');
  return safeStorefrontRedirect(res, transactionId, 'cancelled');
}

export async function getPaymentStatus(req, res) {
  const payment = await Payment.findOne({ transactionId: req.params.transactionId, user: req.user._id })
    .select('transactionId amount currency status order createdAt paidAt')
    .populate('order', 'orderNumber orderStatus paymentStatus total');
  if (!payment) return fail(res, 'Payment not found', 404);
  ok(res, { payment });
}

export async function releaseExpiredReservations() {
  const expired = await Order.find({
    paymentStatus: 'pending',
    stockReserved: true,
    stockReservedUntil: { $lte: new Date() },
  }).select('_id');
  for (const { _id } of expired) {
    const order = await releaseOrder(_id, 'expired', 'cancelled', 'Payment session expired');
    if (order) await Payment.updateMany({ order: order._id, status: { $in: ['pending', 'verifying'] } }, { $set: { status: 'expired' } });
  }
}

export async function markAllExpiredReservations() {
  return releaseExpiredReservations();
}
