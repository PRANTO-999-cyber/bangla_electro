function identifier(value) {
  return value?.toString?.() || '';
}

export function calculateCouponDiscount(coupon, items, subtotal, {
  now = new Date(),
  usageCount = 0,
  userUsageCount = 0,
} = {}) {
  if (!coupon || !coupon.isActive) throw new Error('This coupon is not available.');
  if (coupon.startsAt && new Date(coupon.startsAt) > now) throw new Error('This coupon is not active yet.');
  if (coupon.endsAt && new Date(coupon.endsAt) < now) throw new Error('This coupon has expired.');
  if (coupon.usageLimit > 0 && usageCount >= coupon.usageLimit) throw new Error('This coupon has reached its usage limit.');
  if (coupon.perUserLimit > 0 && userUsageCount >= coupon.perUserLimit) {
    throw new Error('You have reached the usage limit for this coupon.');
  }
  if (subtotal < (coupon.minOrderValue || 0)) {
    throw new Error(`This coupon requires a minimum order of ৳${Number(coupon.minOrderValue).toLocaleString('bn-BD')}.`);
  }

  const productIds = (coupon.applicableProducts || []).map(identifier);
  const categoryIds = (coupon.applicableCategories || []).map(identifier);
  const hasProductRestrictions = productIds.length > 0;
  const hasCategoryRestrictions = categoryIds.length > 0;
  const eligibleSubtotal = items.reduce((sum, item) => {
    const matchesProduct = hasProductRestrictions && productIds.includes(identifier(item.product));
    const matchesCategory = hasCategoryRestrictions && categoryIds.includes(identifier(item.category));
    const eligible = !hasProductRestrictions && !hasCategoryRestrictions || matchesProduct || matchesCategory;
    return eligible ? sum + item.totalPrice : sum;
  }, 0);

  if (eligibleSubtotal <= 0) throw new Error('This coupon does not apply to items in your order.');
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) {
    throw new Error('This coupon has an invalid discount.');
  }
  if (coupon.discountType === 'percentage' && coupon.discountValue > 100) {
    throw new Error('Percentage discounts cannot exceed 100%.');
  }

  const rawDiscount = coupon.discountType === 'percentage'
    ? eligibleSubtotal * coupon.discountValue / 100
    : coupon.discountType === 'fixed'
      ? coupon.discountValue
      : 0;
  if (rawDiscount <= 0) throw new Error('This coupon has an invalid discount type.');
  const cappedDiscount = coupon.maxDiscount > 0 ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
  return Math.round(Math.min(cappedDiscount, eligibleSubtotal) * 100) / 100;
}
