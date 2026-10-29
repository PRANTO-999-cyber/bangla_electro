import { Router } from "express";
import {
  googleLogin,
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/authController.js";
import * as admin from "../controllers/adminController.js";
import * as catalog from "../controllers/catalogController.js";
import * as payment from "../controllers/paymentController.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import { ok } from "../utils/response.js";
import { getSiteContent, updateSiteContent } from "../controllers/siteContentController.js";
import { listNewsletterSubscribers, subscribeToNewsletter } from "../controllers/newsletterController.js";
import rateLimit from "express-rate-limit";

const router = Router();

router.get("/", (req, res) =>
  ok(
    res,
    {
      health: "/api/v1/health",
      products: "/api/v1/products",
      categories: "/api/v1/categories",
      brands: "/api/v1/brands",
      banners: "/api/v1/banners",
      newsletter: "/api/v1/newsletter/subscribe",
    },
    "Electronics E-Commerce API",
  ),
);

router.get("/health", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? "API healthy" : "Database unavailable",
    data: { database: databaseReady ? "connected" : "disconnected" },
  });
});

router.use(
  [
    "/newsletter",
    "/auth",
    "/orders",
    "/payments",
    "/products",
    "/categories",
    "/brands",
    "/banners",
    "/site-content",
    "/admin",
  ],
  (req, res, next) => {
    if (mongoose.connection.readyState === 1) return next();
    return res.status(503).json({
      success: false,
      message:
        "Database unavailable; this endpoint requires a database connection",
      errors: [],
    });
  },
);

const newsletterLimiter = rateLimit({ windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "অনেকবার চেষ্টা করা হয়েছে। এক মিনিট পরে আবার চেষ্টা করুন।", errors: [] } });
router.post("/newsletter/subscribe", newsletterLimiter, subscribeToNewsletter);

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google", googleLogin);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", requireAuth, logout);
router.get("/auth/me", requireAuth, me);
router.get("/orders", requireAuth, async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 10_000)
      : 1;
  const limit =
    Number.isSafeInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 50)
      : 10;
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "orderNumber items shippingAddress subtotal discount shippingCost tax total coupon paymentMethod paymentStatus orderStatus tracking createdAt updatedAt",
      )
      .lean(),
    Order.countDocuments(filter),
  ]);
  return ok(res, {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

router.post(
  "/payments/sslcommerz/sessions",
  requireAuth,
  payment.createSslCommerzPayment,
);
router.get(
  "/payments/sslcommerz/:transactionId/status",
  requireAuth,
  payment.getPaymentStatus,
);
router.post("/payments/sslcommerz/success", payment.sslCommerzSuccess);
router.get("/payments/sslcommerz/success", payment.sslCommerzSuccess);
router.post("/payments/sslcommerz/fail", payment.sslCommerzFailure);
router.get("/payments/sslcommerz/fail", payment.sslCommerzFailure);
router.post("/payments/sslcommerz/cancel", payment.sslCommerzCancel);
router.get("/payments/sslcommerz/cancel", payment.sslCommerzCancel);
router.post("/payments/sslcommerz/ipn", payment.sslCommerzIpn);

router.get("/products", catalog.listProducts);
router.get("/products/:slug/reviews", catalog.listProductReviews);
router.get("/products/:slug", catalog.getProduct);
router.get("/categories", catalog.listCategories);
router.get("/brands", catalog.listBrands);
router.get("/banners", catalog.listBanners);
router.get("/site-content", getSiteContent);

router.use("/admin", requireAuth, requireAdmin);
router.get("/admin/dashboard", admin.dashboard);
router.get("/admin/newsletter/subscribers", listNewsletterSubscribers);
router.put("/admin/site-content", updateSiteContent);
router.get("/admin/products", admin.listAdminProducts);
router.post("/admin/products", admin.createProduct);
router.patch("/admin/products/:id", admin.updateProduct);
router.delete("/admin/products/:id", admin.deleteProduct);
router.get("/admin/orders", admin.listOrders);
router.patch("/admin/orders/:id/status", admin.updateOrderStatus);
router.get("/admin/customers", admin.listCustomers);
router.patch("/admin/customers/:id/status", admin.updateCustomerStatus);
router.get("/admin/reviews", admin.listReviews);
router.patch("/admin/reviews/:id", admin.updateReview);
router.delete("/admin/reviews/:id", admin.deleteReview);
router.get("/admin/coupons", admin.listCoupons);
router.post("/admin/coupons", admin.createCoupon);
router.patch("/admin/coupons/:id", admin.updateCoupon);
router.delete("/admin/coupons/:id", admin.deleteCoupon);
router.get("/admin/inventory", admin.listInventory);
router.post("/admin/inventory/:productId/adjustments", admin.adjustInventory);
router.get("/admin/categories", admin.listAdminCategories);
router.get("/admin/brands", admin.listAdminBrands);
router.get("/admin/banners", admin.listAdminBanners);
router.post("/admin/categories", admin.createCategory);
router.patch("/admin/categories/:id", admin.updateCategory);
router.delete("/admin/categories/:id", admin.deleteCategory);
router.post("/admin/brands", admin.createBrand);
router.patch("/admin/brands/:id", admin.updateBrand);
router.delete("/admin/brands/:id", admin.deleteBrand);
router.post("/admin/banners", admin.createBanner);
router.patch("/admin/banners/:id", admin.updateBanner);
router.delete("/admin/banners/:id", admin.deleteBanner);

export default router;
