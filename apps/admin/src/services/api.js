export const API_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

async function readResult(response) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      `The store API returned an invalid response (${response.status}).`,
    );
  }
  if (!response.ok || !result.success) {
    const error = new Error(
      result.message || `The store API request failed (${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return result.data;
}

export async function requestApi(path, accessToken, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  }).catch((error) => {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot reach the store API at ${API_URL}. Start MongoDB and the API server, then try again.`,
      );
    }
    throw error;
  });
  return readResult(response);
}

export async function refreshAdminSession() {
  return requestApi("/auth/refresh", "", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export function mapProduct(product) {
  return {
    id: product._id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    category: product.category?.name || "",
    categoryId: product.category?._id || product.category || "",
    brand: product.brand?.name || "",
    brandId: product.brand?._id || product.brand || "",
    image: product.images?.[0] || "",
    description: product.shortDescription || product.description || "",
    featured: Boolean(product.featured),
    basePrice: Number(product.basePrice || 0),
    stock: Number(product.stock || 0),
    isActive: Boolean(product.isActive),
  };
}

export function mapOrder(order) {
  return {
    id: order._id,
    orderNumber: order.orderNumber || order._id,
    customer:
      order.user?.name || order.shippingAddress?.name || "Store customer",
    email: order.user?.email || "",
    paymentStatus: order.paymentStatus || "pending",
    orderStatus: order.orderStatus || "pending",
    total: Number(order.total || 0),
    createdAt: order.createdAt
      ? new Date(order.createdAt).toISOString().slice(0, 10)
      : "",
    paymentMethod: order.paymentMethod || "—",
    tracking: {
      carrier: order.tracking?.carrier || "",
      trackingNumber: order.tracking?.trackingNumber || "",
      trackingUrl: order.tracking?.trackingUrl || "",
      notes: order.tracking?.notes || "",
    },
    shippingAddress: order.shippingAddress || {},
    items: (order.items || []).map((item) => ({
      name: item.productName || "Product",
      sku: item.sku || "",
      quantity: Number(item.quantity || 0),
      total: Number(item.totalPrice || 0),
    })),
  };
}

export function mapCustomer(customer, orders = []) {
  return {
    id: customer._id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
    orders:
      customer.orderCount ??
      orders.filter(
        (order) =>
          String(order.user?._id || order.user) === String(customer._id),
      ).length,
    isActive: Boolean(customer.isActive),
  };
}

export function mapReview(review) {
  return {
    id: review._id,
    customer: review.user?.name || "Store customer",
    product: review.product?.name || "Product removed",
    rating: Number(review.rating || 0),
    comment: review.comment || "",
    approved: Boolean(review.approved),
  };
}

export function mapCoupon(coupon) {
  return {
    id: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue || 0),
    minOrderValue: Number(coupon.minOrderValue || 0),
    maxDiscount: coupon.maxDiscount == null ? "" : Number(coupon.maxDiscount),
    usageLimit: coupon.usageLimit == null ? "" : Number(coupon.usageLimit),
    perUserLimit:
      coupon.perUserLimit == null ? "" : Number(coupon.perUserLimit),
    startsAt: coupon.startsAt
      ? new Date(coupon.startsAt).toISOString().slice(0, 10)
      : "",
    endsAt: coupon.endsAt
      ? new Date(coupon.endsAt).toISOString().slice(0, 10)
      : "",
    isActive: Boolean(coupon.isActive),
  };
}

export function mapInventoryMovement(movement) {
  const outgoing = /out|reservation/i.test(movement.movementType || "");
  return {
    id: movement._id,
    product: movement.product?.name || "Product removed",
    sku: movement.product?.sku || "",
    change: outgoing
      ? -Number(movement.quantity || 0)
      : Number(movement.quantity || 0),
    note: movement.note || movement.movementType || "Stock movement",
    date: movement.createdAt
      ? new Date(movement.createdAt).toISOString().slice(0, 10)
      : "",
  };
}

export async function loadAdminData(request) {
  const [
    dashboard,
    productResult,
    orderResult,
    customerResult,
    reviewResult,
    couponResult,
    inventoryResult,
    categoryResult,
    brandResult,
    bannerResult,
  ] = await Promise.all([
    request("/admin/dashboard"),
    request("/admin/products?page=1&limit=50"),
    request("/admin/orders?page=1&limit=50"),
    request("/admin/customers?page=1&limit=50"),
    request("/admin/reviews"),
    request("/admin/coupons"),
    request("/admin/inventory"),
    request("/admin/categories"),
    request("/admin/brands"),
    request("/admin/banners"),
  ]);
  const mappedOrders = orderResult.items.map(mapOrder);
  return {
    dashboard: {
      ...dashboard,
      lowStockProducts: (dashboard.lowStockProducts || []).map((product) => ({
        id: product._id,
        name: product.name,
        sku: product.sku,
        stock: Number(product.stock || 0),
      })),
    },
    products: productResult.items.map(mapProduct),
    productsPagination: productResult.pagination || {
      page: 1,
      pages: 1,
      total: productResult.items.length,
    },
    orders: mappedOrders,
    ordersPagination: orderResult.pagination || {
      page: 1,
      pages: 1,
      total: mappedOrders.length,
    },
    customers: customerResult.items.map((customer) => mapCustomer(customer)),
    customersPagination: customerResult.pagination || {
      page: 1,
      pages: 1,
      total: customerResult.items.length,
    },
    reviews: reviewResult.items.map(mapReview),
    coupons: couponResult.items.map(mapCoupon),
    inventory: inventoryResult.items.map(mapInventoryMovement),
    brands: brandResult.items.map((brand) => ({
      id: brand._id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || "",
      description: brand.description || "",
      isActive: Boolean(brand.isActive),
    })),
    banners: bannerResult.items.map((banner) => ({
      id: banner._id,
      title: banner.title || "",
      image: banner.image || "",
      link: banner.link || "",
      position: banner.position || "hero",
      isActive: Boolean(banner.isActive),
      startsAt: banner.startsAt
        ? new Date(banner.startsAt).toISOString().slice(0, 10)
        : "",
      endsAt: banner.endsAt
        ? new Date(banner.endsAt).toISOString().slice(0, 10)
        : "",
    })),
    categories: categoryResult.items.map((category) => ({
      id: category._id,
      name: category.name,
      slug: category.slug,
      image: category.image || "",
      description: category.description || "",
      isActive: Boolean(category.isActive),
    })),
  };
}

export async function loadAdminProductPage(page, query, request) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (query) params.set("q", query);
  const result = await request(`/admin/products?${params}`);
  return {
    rows: result.items.map(mapProduct),
    pagination: result.pagination,
  };
}

export async function loadAdminOrderPage(page, query, request) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (query) params.set("q", query);
  const result = await request(`/admin/orders?${params}`);
  return {
    rows: result.items.map(mapOrder),
    pagination: result.pagination,
  };
}

export async function loadAdminCustomerPage(page, query, request) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (query) params.set("q", query);
  const result = await request(`/admin/customers?${params}`);
  return {
    rows: result.items.map((customer) => mapCustomer(customer)),
    pagination: result.pagination,
  };
}

function productPayload(record) {
  return {
    name: String(record.name || "").trim(),
    slug: String(record.name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    sku: String(record.sku || "").trim(),
    category: record.categoryId || undefined,
    brand: record.brandId || null,
    images: record.image ? [String(record.image).trim()] : [],
    shortDescription: String(record.description || "").trim(),
    featured: Boolean(record.featured),
    basePrice: Number(record.basePrice),
    stock: Number(record.stock),
    isActive: record.isActive !== false,
  };
}

function couponPayload(record) {
  return {
    code: String(record.code || "")
      .trim()
      .toUpperCase(),
    discountType: record.discountType,
    discountValue: Number(record.discountValue),
    minOrderValue: Number(record.minOrderValue || 0),
    maxDiscount:
      record.maxDiscount === "" || record.maxDiscount == null
        ? undefined
        : Number(record.maxDiscount),
    usageLimit:
      record.usageLimit === "" || record.usageLimit == null
        ? undefined
        : Number(record.usageLimit),
    perUserLimit:
      record.perUserLimit === "" || record.perUserLimit == null
        ? undefined
        : Number(record.perUserLimit),
    startsAt: record.startsAt
      ? new Date(`${record.startsAt}T00:00:00.000Z`).toISOString()
      : undefined,
    endsAt: record.endsAt
      ? new Date(`${record.endsAt}T23:59:59.999Z`).toISOString()
      : undefined,
    isActive: record.isActive !== false,
  };
}

export async function saveAdminRecord(collection, record, request) {
  const existing = Boolean(record.id);
  const id = encodeURIComponent(record.id || "");
  const methods = {
    products: {
      path: existing ? `/admin/products/${id}` : "/admin/products",
      method: existing ? "PATCH" : "POST",
      body: productPayload(record),
    },
    orders: {
      path: `/admin/orders/${id}/status`,
      method: "PATCH",
      body: {
        orderStatus: record.orderStatus,
        ...(record.tracking ? { tracking: record.tracking } : {}),
      },
    },
    customers: {
      path: `/admin/customers/${id}/status`,
      method: "PATCH",
      body: { isActive: Boolean(record.isActive) },
    },
    reviews: {
      path: `/admin/reviews/${id}`,
      method: "PATCH",
      body: { approved: Boolean(record.approved) },
    },
    coupons: {
      path: existing ? `/admin/coupons/${id}` : "/admin/coupons",
      method: existing ? "PATCH" : "POST",
      body: couponPayload(record),
    },
    categories: {
      path: existing ? `/admin/categories/${id}` : "/admin/categories",
      method: existing ? "PATCH" : "POST",
      body: {
        name: String(record.name || "").trim(),
        slug: String(record.slug || record.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        image: record.image || "",
        description: record.description || "",
        isActive: record.isActive !== false,
      },
    },
    brands: {
      path: existing ? `/admin/brands/${id}` : "/admin/brands",
      method: existing ? "PATCH" : "POST",
      body: {
        name: String(record.name || "").trim(),
        slug: String(record.slug || record.name || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
        logo: record.logo || "",
        description: record.description || "",
        isActive: record.isActive !== false,
      },
    },
    banners: {
      path: existing ? `/admin/banners/${id}` : "/admin/banners",
      method: existing ? "PATCH" : "POST",
      body: {
        title: String(record.title || "").trim(),
        image: String(record.image || "").trim(),
        link: String(record.link || "").trim(),
        position: record.position || "hero",
        isActive: record.isActive !== false,
        startsAt: record.startsAt
          ? new Date(`${record.startsAt}T00:00:00.000Z`).toISOString()
          : undefined,
        endsAt: record.endsAt
          ? new Date(`${record.endsAt}T23:59:59.999Z`).toISOString()
          : undefined,
      },
    },
  };
  const operation = methods[collection];
  if (!operation)
    throw new Error(`Unsupported admin collection: ${collection}`);
  return request(operation.path, {
    method: operation.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(operation.body),
  });
}

export async function deleteAdminRecord(collection, record, request) {
  const id = encodeURIComponent(record.id);
  const paths = {
    products: `/admin/products/${id}`,
    reviews: `/admin/reviews/${id}`,
    coupons: `/admin/coupons/${id}`,
    categories: `/admin/categories/${id}`,
    brands: `/admin/brands/${id}`,
    banners: `/admin/banners/${id}`,
  };
  const path = paths[collection];
  if (!path) throw new Error(`Deleting ${collection} is not supported.`);
  return request(path, { method: "DELETE" });
}

export async function adjustAdminInventory(product, quantity, note, request) {
  return request(
    `/admin/inventory/${encodeURIComponent(product.id)}/adjustments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, note }),
    },
  );
}
