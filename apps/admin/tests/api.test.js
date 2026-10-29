import assert from "node:assert/strict";
import { test } from "node:test";
import {
  deleteAdminRecord,
  loadAdminCustomerPage,
  loadAdminData,
  loadAdminOrderPage,
  loadAdminProductPage,
  mapCustomer,
  mapInventoryMovement,
  mapOrder,
  mapProduct,
  mapReview,
  requestApi,
  saveAdminRecord,
} from "../src/services/api.js";

test("maps populated API products to admin list rows", () => {
  const product = mapProduct({
    _id: "product-1",
    name: "Studio Headphones",
    slug: "studio-headphones",
    sku: "AUD-001",
    category: { _id: "category-1", name: "Audio" },
    brand: { _id: "brand-1", name: "Sonic" },
    images: ["/products/headphones.jpg"],
    shortDescription: "",
    featured: false,
    basePrice: 15999,
    stock: 4,
    isActive: true,
  });
  assert.deepEqual(product, {
    id: "product-1",
    name: "Studio Headphones",
    slug: "studio-headphones",
    sku: "AUD-001",
    category: "Audio",
    categoryId: "category-1",
    brand: "Sonic",
    brandId: "brand-1",
    image: "/products/headphones.jpg",
    description: "",
    featured: false,
    basePrice: 15999,
    stock: 4,
    isActive: true,
  });
});

test("maps customers with order counts from populated orders", () => {
  const customer = mapCustomer(
    {
      _id: "user-1",
      name: "A Customer",
      email: "customer@example.test",
      isActive: true,
    },
    [
      { user: { _id: "user-1" } },
      { user: { _id: "user-2" } },
      { user: "user-1" },
    ],
  );
  assert.equal(customer.orders, 2);
  assert.equal(customer.isActive, true);
});

test("admin collection pages request bounded records and map pagination", async () => {
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    return {
      items: [
        {
          _id: "record-1",
          name: "Wireless Mouse",
          user: { _id: "user-1" },
          orderCount: 3,
        },
      ],
      pagination: { page: 2, limit: 50, total: 61, pages: 2 },
    };
  };

  const [products, orders, customers] = await Promise.all([
    loadAdminProductPage(2, "mouse & keyboard", request),
    loadAdminOrderPage(2, "", request),
    loadAdminCustomerPage(2, "", request),
  ]);

  assert.deepEqual(calls, [
    "/admin/products?page=2&limit=50&q=mouse+%26+keyboard",
    "/admin/orders?page=2&limit=50",
    "/admin/customers?page=2&limit=50",
  ]);
  assert.equal(products.rows[0].name, "Wireless Mouse");
  assert.equal(orders.rows[0].customer, "Store customer");
  assert.equal(customers.rows[0].orders, 3);
  assert.equal(customers.pagination.pages, 2);
});

test("admin startup loads only the first bounded order, customer, and product pages", async () => {
  const calls = [];
  const request = async (path) => {
    calls.push(path);
    if (path === "/admin/dashboard") return { lowStockProducts: [] };
    if (path.startsWith("/admin/products"))
      return { items: [], pagination: { page: 1, pages: 3, total: 101 } };
    if (path.startsWith("/admin/orders"))
      return { items: [], pagination: { page: 1, pages: 5, total: 201 } };
    if (path.startsWith("/admin/customers"))
      return { items: [], pagination: { page: 1, pages: 4, total: 151 } };
    if (
      path === "/admin/reviews" ||
      path === "/admin/coupons" ||
      path === "/admin/inventory" ||
      path === "/admin/categories" ||
      path === "/admin/brands"
    )
      return { items: [] };
    if (path === "/admin/banners")
      return {
        items: [
          {
            _id: "banner-1",
            title: "Summer sale",
            image: "https://cdn.example.test/summer.jpg",
            link: "/shop",
            position: "hero",
            isActive: true,
            startsAt: "2026-06-01T00:00:00.000Z",
            endsAt: "2026-06-30T23:59:59.999Z",
          },
        ],
      };
    throw new Error(`Unexpected request: ${path}`);
  };

  const data = await loadAdminData(request);

  assert.deepEqual(calls, [
    "/admin/dashboard",
    "/admin/products?page=1&limit=50",
    "/admin/orders?page=1&limit=50",
    "/admin/customers?page=1&limit=50",
    "/admin/reviews",
    "/admin/coupons",
    "/admin/inventory",
    "/admin/categories",
    "/admin/brands",
    "/admin/banners",
  ]);
  assert.equal(data.productsPagination.pages, 3);
  assert.equal(data.ordersPagination.pages, 5);
  assert.equal(data.customersPagination.pages, 4);
  assert.deepEqual(data.banners, [
    {
      id: "banner-1",
      title: "Summer sale",
      image: "https://cdn.example.test/summer.jpg",
      link: "/shop",
      position: "hero",
      isActive: true,
      startsAt: "2026-06-01",
      endsAt: "2026-06-30",
    },
  ]);
});

test("admin API connection failures give actionable startup guidance", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });

  await assert.rejects(
    requestApi("/auth/login", ""),
    /Cannot reach the store API.*Start MongoDB and the API server/,
  );
});

test("maps shipment tracking and saves fulfillment updates", async () => {
  const order = mapOrder({
    _id: "order-1",
    orderNumber: "ES-100",
    paymentStatus: "paid",
    orderStatus: "shipped",
    tracking: {
      carrier: "Pathao",
      trackingNumber: "TRACK-100",
      trackingUrl: "https://track.example.test/100",
      notes: "On the way",
    },
    items: [],
  });
  assert.deepEqual(order.tracking, {
    carrier: "Pathao",
    trackingNumber: "TRACK-100",
    trackingUrl: "https://track.example.test/100",
    notes: "On the way",
  });
  let call;
  await saveAdminRecord(
    "orders",
    {
      id: "order-1",
      orderStatus: "shipped",
      tracking: order.tracking,
    },
    async (path, options) => {
      call = { path, options };
      return {};
    },
  );
  assert.equal(call.path, "/admin/orders/order-1/status");
  assert.deepEqual(JSON.parse(call.options.body), {
    orderStatus: "shipped",
    tracking: order.tracking,
  });
});

test("maps moderated reviews and signed stock movements", () => {
  assert.deepEqual(
    mapReview({
      _id: "review-1",
      user: { name: "A Customer" },
      product: { name: "Monitor" },
      rating: 4,
      comment: "Clear image",
      approved: false,
    }),
    {
      id: "review-1",
      customer: "A Customer",
      product: "Monitor",
      rating: 4,
      comment: "Clear image",
      approved: false,
    },
  );
  assert.equal(
    mapInventoryMovement({
      _id: "movement-1",
      movementType: "adjustment-out",
      quantity: 3,
    }).change,
    -3,
  );
});

test("creates products with API-compatible category IDs and slugs", async () => {
  let call;
  await saveAdminRecord(
    "products",
    {
      name: "New Audio Device",
      sku: "AUD-NEW",
      categoryId: "category-1",
      image: "/products/headphones.jpg",
      basePrice: "1200",
      stock: "9",
      featured: false,
      isActive: true,
    },
    async (path, options) => {
      call = { path, options };
      return {};
    },
  );
  assert.equal(call.path, "/admin/products");
  assert.equal(call.options.method, "POST");
  assert.deepEqual(JSON.parse(call.options.body), {
    name: "New Audio Device",
    slug: "new-audio-device",
    sku: "AUD-NEW",
    category: "category-1",
    brand: null,
    images: ["/products/headphones.jpg"],
    shortDescription: "",
    featured: false,
    basePrice: 1200,
    stock: 9,
    isActive: true,
  });
});

test("creates and updates banners with image, placement, and schedule fields", async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {};
  };
  const banner = {
    title: "Summer sale",
    image: "https://cdn.example.test/summer.jpg",
    link: "/shop",
    position: "hero",
    startsAt: "2026-06-01",
    endsAt: "2026-06-30",
    isActive: true,
  };

  await saveAdminRecord("banners", banner, request);
  await saveAdminRecord(
    "banners",
    { ...banner, id: "banner-1", isActive: false },
    request,
  );
  await saveAdminRecord(
    "banners",
    { ...banner, title: "Top promo", position: "promotion" },
    request,
  );
  await saveAdminRecord(
    "banners",
    { ...banner, title: "Bottom promo", position: "service" },
    request,
  );

  assert.deepEqual(
    calls.map(({ path, options }) => [path, options.method]),
    [
      ["/admin/banners", "POST"],
      ["/admin/banners/banner-1", "PATCH"],
      ["/admin/banners", "POST"],
      ["/admin/banners", "POST"],
    ],
  );
  const created = JSON.parse(calls[0].options.body);
  assert.equal(created.image, banner.image);
  assert.equal(created.position, "hero");
  assert.equal(created.startsAt, "2026-06-01T00:00:00.000Z");
  assert.equal(created.endsAt, "2026-06-30T23:59:59.999Z");
  assert.equal(JSON.parse(calls[1].options.body).isActive, false);
  assert.equal(JSON.parse(calls[2].options.body).position, "promotion");
  assert.equal(JSON.parse(calls[3].options.body).position, "service");
});

test("customer edits only update account access, and product deletes use deactivation endpoint", async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {};
  };
  await saveAdminRecord(
    "customers",
    { id: "user-1", name: "A Customer", isActive: false },
    request,
  );
  await deleteAdminRecord("products", { id: "product-1" }, request);
  await deleteAdminRecord("banners", { id: "banner-1" }, request);
  assert.deepEqual(
    calls.map(({ path, options }) => [path, options.method, options.body]),
    [
      [
        "/admin/customers/user-1/status",
        "PATCH",
        JSON.stringify({ isActive: false }),
      ],
      ["/admin/products/product-1", "DELETE", undefined],
      ["/admin/banners/banner-1", "DELETE", undefined],
    ],
  );
});

test("restores inactive products and categories through their update endpoints", async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {};
  };
  await saveAdminRecord(
    "products",
    {
      id: "product-1",
      name: "Portable Speaker",
      sku: "AUD-SPEAKER-1",
      categoryId: "category-1",
      brandId: "brand-1",
      basePrice: 8000,
      stock: 12,
      isActive: true,
    },
    request,
  );
  await saveAdminRecord(
    "categories",
    {
      id: "category-1",
      name: "Audio",
      slug: "audio",
      isActive: true,
    },
    request,
  );
  assert.equal(calls[0].path, "/admin/products/product-1");
  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(JSON.parse(calls[0].options.body).isActive, true);
  assert.equal(calls[1].path, "/admin/categories/category-1");
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(JSON.parse(calls[1].options.body).isActive, true);
});
