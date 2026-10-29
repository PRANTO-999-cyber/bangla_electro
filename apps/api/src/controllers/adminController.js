import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Banner from "../models/Banner.js";
import Category from "../models/Category.js";
import Coupon from "../models/Coupon.js";
import Inventory from "../models/Inventory.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { fail, ok } from "../utils/response.js";

const orderStatuses = new Set([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "on-hold",
]);
const editableProductFields = [
  "name",
  "slug",
  "brand",
  "category",
  "shortDescription",
  "description",
  "images",
  "basePrice",
  "sku",
  "variants",
  "specifications",
  "warranty",
  "tags",
  "featured",
  "isActive",
  "stock",
];
const editableCouponFields = [
  "code",
  "discountType",
  "discountValue",
  "minOrderValue",
  "maxDiscount",
  "applicableProducts",
  "applicableCategories",
  "usageLimit",
  "perUserLimit",
  "startsAt",
  "endsAt",
  "isActive",
];
const editableCategoryFields = [
  "name",
  "slug",
  "image",
  "description",
  "isActive",
];
const editableBrandFields = ["name", "slug", "logo", "description", "isActive"];
const editableBannerFields = [
  "title",
  "image",
  "link",
  "position",
  "isActive",
  "startsAt",
  "endsAt",
];
const bannerPositions = new Set(["hero", "promotion", "service"]);

function pick(source, allowed) {
  const body = source && typeof source === "object" ? source : {};
  return Object.fromEntries(
    allowed
      .filter((key) => body[key] !== undefined)
      .map((key) => [key, body[key]]),
  );
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function paginationFromQuery(query, defaultLimit = 50) {
  const parsePositiveInteger = (value, fallback, maximum) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isSafeInteger(parsed) && parsed > 0
      ? Math.min(parsed, maximum)
      : fallback;
  };
  return {
    page: parsePositiveInteger(query.page, 1, 10_000),
    limit: parsePositiveInteger(query.limit, defaultLimit, 100),
  };
}

function validateProduct(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Product details are required";
  if (typeof body.name !== "string" || !body.name.trim())
    return "Product name is required";
  if (
    typeof body.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug)
  )
    return "A valid lowercase product slug is required";
  if (typeof body.sku !== "string" || !body.sku.trim())
    return "Product SKU is required";
  if (!Number.isFinite(Number(body.basePrice)) || Number(body.basePrice) < 0)
    return "Product price must be a non-negative number";
  return null;
}

export async function dashboard(req, res) {
  const [
    products,
    orders,
    customers,
    lowStock,
    lowStockProducts,
    pendingReviews,
    revenue,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true, stock: { $lt: 10 } }),
    Product.find({ isActive: true, stock: { $lt: 10 } })
      .sort({ stock: 1, _id: 1 })
      .limit(5)
      .select("name sku stock")
      .lean(),
    Review.countDocuments({ approved: false }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
  ]);
  ok(res, {
    products,
    orders,
    customers,
    lowStock,
    lowStockProducts,
    pendingReviews,
    paidRevenue: revenue[0]?.total || 0,
  });
}

export async function listAdminProducts(req, res) {
  const { page, limit } = paginationFromQuery(req.query);
  const filter = {};
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    filter.$text = { $search: req.query.q.trim().slice(0, 100) };
  }
  const sort = filter.$text
    ? { score: { $meta: "textScore" }, _id: 1 }
    : { updatedAt: -1, _id: -1 };
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);
  ok(res, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function createProduct(req, res) {
  const error = validateProduct(req.body);
  if (error) return fail(res, error, 400);
  const product = await Product.create(pick(req.body, editableProductFields));
  ok(res, { product }, "Product created", 201);
}

export async function updateProduct(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid product id", 400);
  const updates = pick(req.body, editableProductFields);
  if (!Object.keys(updates).length)
    return fail(res, "No valid product fields provided", 400);
  const error = validateProduct(updates);
  if (
    error &&
    (updates.name !== undefined ||
      updates.slug !== undefined ||
      updates.sku !== undefined ||
      updates.basePrice !== undefined)
  ) {
    const current = await Product.findById(req.params.id).lean();
    if (!current) return fail(res, "Product not found", 404);
    const mergedError = validateProduct({ ...current, ...updates });
    if (mergedError) return fail(res, mergedError, 400);
  }
  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) return fail(res, "Product not found", 404);
  ok(res, { product }, "Product updated");
}

export async function deleteProduct(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid product id", 400);
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!product) return fail(res, "Product not found", 404);
  ok(res, { product }, "Product deactivated");
}

export async function listOrders(req, res) {
  const { page, limit } = paginationFromQuery(req.query);
  const filter = {};
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    const query = req.query.q.trim().slice(0, 100);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingCustomers = await User.find({ $text: { $search: query } })
      .select("_id")
      .lean();
    filter.$or = [
      { orderNumber: { $regex: `^${escaped}`, $options: "i" } },
      { "shippingAddress.name": { $regex: `^${escaped}`, $options: "i" } },
      { "shippingAddress.email": { $regex: `^${escaped}`, $options: "i" } },
      ...(matchingCustomers.length
        ? [{ user: { $in: matchingCustomers.map(({ _id }) => _id) } }]
        : []),
    ];
  }
  if (req.query.status) {
    if (
      typeof req.query.status !== "string" ||
      !orderStatuses.has(req.query.status)
    ) {
      return fail(res, "Invalid order status filter", 400);
    }
    filter.orderStatus = req.query.status;
  }
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email"),
    Order.countDocuments(filter),
  ]);
  ok(res, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function updateOrderStatus(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid order id", 400);
  const orderStatus = req.body?.orderStatus;
  if (!orderStatuses.has(orderStatus))
    return fail(res, "Invalid order status", 400);
  const updates = { orderStatus };
  if (req.body.tracking !== undefined) {
    if (
      !req.body.tracking ||
      typeof req.body.tracking !== "object" ||
      Array.isArray(req.body.tracking)
    ) {
      return fail(res, "Tracking details must be an object", 400);
    }
    const {
      carrier = "",
      trackingNumber = "",
      trackingUrl = "",
      notes = "",
    } = req.body.tracking || {};
    if (
      [carrier, trackingNumber, trackingUrl, notes].some(
        (value) => typeof value !== "string",
      )
    ) {
      return fail(res, "Tracking details must be text", 400);
    }
    if (trackingUrl) {
      let parsedUrl;
      try {
        parsedUrl = new URL(trackingUrl);
      } catch {
        return fail(res, "Tracking URL must be a valid HTTP or HTTPS URL", 400);
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return fail(res, "Tracking URL must be a valid HTTP or HTTPS URL", 400);
      }
    }
    updates.tracking = {
      carrier: carrier.trim().slice(0, 100),
      trackingNumber: trackingNumber.trim().slice(0, 120),
      trackingUrl: trackingUrl.trim().slice(0, 500),
      notes: notes.trim().slice(0, 500),
      updatedAt: new Date(),
    };
  }
  const currentOrder = await Order.findById(req.params.id).select(
    "paymentStatus",
  );
  if (!currentOrder) return fail(res, "Order not found", 404);
  if (
    !["cancelled", "on-hold"].includes(orderStatus) &&
    currentOrder.paymentStatus !== "paid"
  ) {
    return fail(res, "Only paid orders can move through fulfillment", 409);
  }
  const order = await Order.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate("user", "name email");
  if (!order) return fail(res, "Order not found", 404);
  ok(res, { order }, "Order updated");
}

export async function listCustomers(req, res) {
  const { page, limit } = paginationFromQuery(req.query);
  const filter = { role: "customer" };
  if (typeof req.query.q === "string" && req.query.q.trim()) {
    filter.$text = { $search: req.query.q.trim().slice(0, 100) };
  }
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email phone isActive createdAt lastLoginAt")
      .lean(),
    User.countDocuments(filter),
  ]);
  const orderCounts = items.length
    ? await Order.aggregate([
        { $match: { user: { $in: items.map(({ _id }) => _id) } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ])
    : [];
  const countsByUser = new Map(
    orderCounts.map(({ _id, count }) => [String(_id), count]),
  );
  ok(res, {
    items: items.map((customer) => ({
      ...customer,
      orderCount: countsByUser.get(String(customer._id)) || 0,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function updateCustomerStatus(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid customer id", 400);
  if (typeof req.body?.isActive !== "boolean")
    return fail(res, "isActive must be true or false", 400);
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "customer" },
    { isActive: req.body.isActive },
    { new: true, runValidators: true },
  ).select("name email phone isActive");
  if (!customer) return fail(res, "Customer not found", 404);
  ok(res, { customer }, "Customer updated");
}

export async function listReviews(req, res) {
  const filter = {};
  if (req.query.approved === "true") filter.approved = true;
  if (req.query.approved === "false") filter.approved = false;
  const items = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("user", "name email")
    .populate("product", "name slug");
  ok(res, { items });
}

export async function updateReview(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid review id", 400);
  if (typeof req.body?.approved !== "boolean")
    return fail(res, "approved must be true or false", 400);
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { approved: req.body.approved },
    { new: true, runValidators: true },
  );
  if (!review) return fail(res, "Review not found", 404);
  await refreshProductRating(review.product);
  ok(res, { review }, "Review updated");
}

export async function deleteReview(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid review id", 400);
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return fail(res, "Review not found", 404);
  await refreshProductRating(review.product);
  ok(res, {}, "Review deleted");
}

async function refreshProductRating(productId) {
  if (!productId) return;
  const [result] = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        approved: true,
      },
    },
    { $group: { _id: null, rating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: result?.rating || 0,
    reviewCount: result?.count || 0,
  });
}

export async function listCoupons(req, res) {
  const items = await Coupon.find().sort({ createdAt: -1 });
  ok(res, { items });
}

function validateCoupon(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Coupon details are required";
  if (typeof body.code !== "string" || !body.code.trim())
    return "Coupon code is required";
  if (!["percentage", "fixed"].includes(body.discountType))
    return "discountType must be percentage or fixed";
  if (
    !Number.isFinite(Number(body.discountValue)) ||
    Number(body.discountValue) <= 0
  )
    return "discountValue must be greater than zero";
  if (body.discountType === "percentage" && Number(body.discountValue) > 100)
    return "Percentage discount cannot exceed 100";
  return null;
}

export async function createCoupon(req, res) {
  const error = validateCoupon(req.body);
  if (error) return fail(res, error, 400);
  const coupon = await Coupon.create({
    ...pick(req.body, editableCouponFields),
    code: req.body.code.trim().toUpperCase(),
  });
  ok(res, { coupon }, "Coupon created", 201);
}

export async function updateCoupon(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid coupon id", 400);
  const updates = pick(req.body, editableCouponFields);
  if (!Object.keys(updates).length)
    return fail(res, "No valid coupon fields provided", 400);
  if (typeof updates.code === "string")
    updates.code = updates.code.trim().toUpperCase();
  const current = await Coupon.findById(req.params.id).lean();
  if (!current) return fail(res, "Coupon not found", 404);
  const error = validateCoupon({ ...current, ...updates });
  if (error) return fail(res, error, 400);
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  ok(res, { coupon }, "Coupon updated");
}

export async function deleteCoupon(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid coupon id", 400);
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return fail(res, "Coupon not found", 404);
  ok(res, {}, "Coupon deleted");
}

export async function listInventory(req, res) {
  const items = await Inventory.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("product", "name sku");
  ok(res, { items });
}

export async function adjustInventory(req, res) {
  if (!validId(req.params.productId))
    return fail(res, "Invalid product id", 400);
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity === 0)
    return fail(res, "quantity must be a non-zero whole number", 400);
  if (typeof req.body?.note !== "string" || !req.body.note.trim())
    return fail(res, "A reason is required for stock adjustments", 400);

  const filter = { _id: req.params.productId };
  if (quantity < 0)
    filter.$expr = { $gte: [{ $ifNull: ["$stock", 0] }, Math.abs(quantity)] };
  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { stock: quantity } },
    { new: true, runValidators: true },
  );
  if (!product) {
    const exists = await Product.exists({ _id: req.params.productId });
    return fail(
      res,
      exists ? "Stock cannot be reduced below zero" : "Product not found",
      exists ? 400 : 404,
    );
  }
  const movement = await Inventory.create({
    product: product._id,
    movementType: quantity > 0 ? "adjustment-in" : "adjustment-out",
    quantity: Math.abs(quantity),
    previousStock: product.stock - quantity,
    newStock: product.stock,
    note: req.body.note.trim(),
    createdBy: req.user._id,
  });
  ok(res, { product, movement }, "Inventory adjusted");
}

export async function listAdminCategories(req, res) {
  ok(res, { items: await Category.find().sort({ name: 1 }) });
}

export async function listAdminBrands(req, res) {
  ok(res, { items: await Brand.find().sort({ name: 1 }) });
}

export async function listAdminBanners(req, res) {
  ok(res, { items: await Banner.find().sort({ createdAt: -1 }) });
}

function bannerUpdates(body) {
  const updates = pick(body, editableBannerFields);
  for (const field of ["title", "image", "link", "position"]) {
    if (typeof updates[field] === "string")
      updates[field] = updates[field].trim();
  }
  return updates;
}

function validateBanner(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Banner details are required";
  if (typeof body.title !== "string" || !body.title.trim())
    return "Banner title is required";
  if (typeof body.image !== "string" || !body.image.trim())
    return "Banner image URL is required";
  if (body.link && typeof body.link !== "string")
    return "Banner link must be a URL or path";
  if (body.position && !bannerPositions.has(body.position))
    return "Banner position must be a supported storefront placement";
  if (body.startsAt && Number.isNaN(Date.parse(body.startsAt)))
    return "Banner start date is invalid";
  if (body.endsAt && Number.isNaN(Date.parse(body.endsAt)))
    return "Banner end date is invalid";
  if (
    body.startsAt &&
    body.endsAt &&
    Date.parse(body.startsAt) > Date.parse(body.endsAt)
  ) {
    return "Banner end date must be after its start date";
  }
  return null;
}

export async function createBanner(req, res) {
  const updates = bannerUpdates(req.body);
  const error = validateBanner(updates);
  if (error) return fail(res, error, 400);
  const banner = await Banner.create(updates);
  return ok(res, { banner }, "Banner created", 201);
}

export async function updateBanner(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid banner id", 400);
  const updates = bannerUpdates(req.body);
  if (!Object.keys(updates).length)
    return fail(res, "No valid banner fields provided", 400);
  const current = await Banner.findById(req.params.id).lean();
  if (!current) return fail(res, "Banner not found", 404);
  const error = validateBanner({ ...current, ...updates });
  if (error) return fail(res, error, 400);
  const banner = await Banner.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  return ok(res, { banner }, "Banner updated");
}

export async function deleteBanner(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid banner id", 400);
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return fail(res, "Banner not found", 404);
  return ok(res, { banner }, "Banner deleted");
}

function validateCategory(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Category details are required";
  if (typeof body.name !== "string" || !body.name.trim())
    return "Category name is required";
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().toLowerCase()
      : body.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return "A valid category slug is required";
  return null;
}

function categoryUpdates(body) {
  const updates = pick(body, editableCategoryFields);
  if (typeof updates.name === "string") updates.name = updates.name.trim();
  if (typeof updates.slug === "string")
    updates.slug = updates.slug.trim().toLowerCase();
  else if (typeof updates.name === "string")
    updates.slug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  if (typeof updates.image === "string") updates.image = updates.image.trim();
  if (typeof updates.description === "string")
    updates.description = updates.description.trim();
  return updates;
}

export async function createCategory(req, res) {
  const updates = categoryUpdates(req.body);
  const error = validateCategory(updates);
  if (error) return fail(res, error, 400);
  const category = await Category.create(updates);
  return ok(res, { category }, "Category created", 201);
}

export async function updateCategory(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid category id", 400);
  const updates = categoryUpdates(req.body);
  if (!Object.keys(updates).length)
    return fail(res, "No valid category fields provided", 400);
  const current = await Category.findById(req.params.id).lean();
  if (!current) return fail(res, "Category not found", 404);
  if (current.isActive && updates.isActive === false) {
    const activeProducts = await Product.countDocuments({
      category: current._id,
      isActive: true,
    });
    if (activeProducts) {
      return fail(
        res,
        `Cannot deactivate this category while ${activeProducts} active product${activeProducts === 1 ? "" : "s"} use it. Reassign or deactivate those products first.`,
        409,
      );
    }
  }
  const error = validateCategory({ ...current, ...updates });
  if (error) return fail(res, error, 400);
  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  return ok(res, { category }, "Category updated");
}

export async function deleteCategory(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid category id", 400);
  const current = await Category.findById(req.params.id).select("isActive");
  if (!current) return fail(res, "Category not found", 404);
  if (current.isActive) {
    const activeProducts = await Product.countDocuments({
      category: current._id,
      isActive: true,
    });
    if (activeProducts) {
      return fail(
        res,
        `Cannot deactivate this category while ${activeProducts} active product${activeProducts === 1 ? "" : "s"} use it. Reassign or deactivate those products first.`,
        409,
      );
    }
  }
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  return ok(res, { category }, "Category deactivated");
}

function validateBrand(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Brand details are required";
  if (typeof body.name !== "string" || !body.name.trim())
    return "Brand name is required";
  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim().toLowerCase()
      : body.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return "A valid brand slug is required";
  return null;
}

function brandUpdates(body) {
  const updates = pick(body, editableBrandFields);
  if (typeof updates.name === "string") updates.name = updates.name.trim();
  if (typeof updates.slug === "string")
    updates.slug = updates.slug.trim().toLowerCase();
  else if (typeof updates.name === "string")
    updates.slug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  if (typeof updates.logo === "string") updates.logo = updates.logo.trim();
  if (typeof updates.description === "string")
    updates.description = updates.description.trim();
  return updates;
}

export async function createBrand(req, res) {
  const updates = brandUpdates(req.body);
  const error = validateBrand(updates);
  if (error) return fail(res, error, 400);
  const brand = await Brand.create(updates);
  return ok(res, { brand }, "Brand created", 201);
}

export async function updateBrand(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid brand id", 400);
  const updates = brandUpdates(req.body);
  if (!Object.keys(updates).length)
    return fail(res, "No valid brand fields provided", 400);
  const current = await Brand.findById(req.params.id).lean();
  if (!current) return fail(res, "Brand not found", 404);
  const error = validateBrand({ ...current, ...updates });
  if (error) return fail(res, error, 400);
  const brand = await Brand.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  return ok(res, { brand }, "Brand updated");
}

export async function deleteBrand(req, res) {
  if (!validId(req.params.id)) return fail(res, "Invalid brand id", 400);
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!brand) return fail(res, "Brand not found", 404);
  return ok(res, { brand }, "Brand deactivated");
}
