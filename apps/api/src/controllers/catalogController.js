import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Banner from "../models/Banner.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { fail, ok } from "../utils/response.js";

const positiveInteger = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
};

export async function listProducts(req, res) {
  const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInteger(req.query.limit, 24, 100);
  const filter = { isActive: true };
  if (typeof req.query.category === "string" && req.query.category) {
    const category = mongoose.isValidObjectId(req.query.category)
      ? req.query.category
      : await Category.findOne({
          slug: req.query.category,
          isActive: true,
        }).select("_id");
    if (!category)
      return ok(res, {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    filter.category = category._id || category;
  }
  if (typeof req.query.brand === "string" && req.query.brand) {
    const brand = mongoose.isValidObjectId(req.query.brand)
      ? req.query.brand
      : await Brand.findOne({ slug: req.query.brand, isActive: true }).select(
          "_id",
        );
    if (!brand)
      return ok(res, {
        items: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    filter.brand = brand._id || brand;
  }
  if (req.query.featured === "true") filter.featured = true;
  if (typeof req.query.q === "string" && req.query.q.trim())
    filter.$text = { $search: req.query.q.trim().slice(0, 100) };

  const sortOptions = new Map([
    ["newest", { createdAt: -1 }],
    ["price-asc", { basePrice: 1 }],
    ["price-desc", { basePrice: -1 }],
    ["rating", { rating: -1, reviewCount: -1 }],
  ]);
  const sortBy =
    (typeof req.query.sort === "string" && sortOptions.get(req.query.sort)) ||
    (filter.$text
      ? { score: { $meta: "textScore" } }
      : { featured: -1, createdAt: -1 });
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortBy)
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

export async function getProduct(req, res) {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .lean();
  if (!product) return fail(res, "Product not found", 404);
  ok(res, { product });
}

export async function listCategories(req, res) {
  const categories = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .select("name slug description image parent")
    .lean();
  ok(res, { items: categories });
}

export async function listBrands(req, res) {
  const brands = await Brand.find({ isActive: true })
    .sort({ name: 1 })
    .select("name slug description logo")
    .lean();
  ok(res, { items: brands });
}

export async function listBanners(req, res) {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    position: { $in: ["hero", "promotion", "service"] },
    image: { $type: "string", $ne: "" },
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .select("title image link position")
    .lean();
  ok(res, { items: banners });
}

export async function listProductReviews(req, res) {
  const identity = req.params.slug;
  const productFilter = mongoose.isValidObjectId(identity)
    ? { _id: identity }
    : { slug: identity };
  const product = await Product.findOne({ ...productFilter, isActive: true })
    .select("_id")
    .lean();
  if (!product) return fail(res, "Product not found", 404);
  const page = positiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = positiveInteger(req.query.limit, 10, 50);
  const [items, total] = await Promise.all([
    Review.find({ product: product._id, approved: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name")
      .lean(),
    Review.countDocuments({ product: product._id, approved: true }),
  ]);
  ok(res, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
