import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import app from "../../src/app.js";

let server;
let origin;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
});

test("API root redirects browsers to the admin dashboard", async () => {
  const response = await fetch(`${origin}/`, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "http://localhost:5174/admin");
});

test("versioned API root lists the public endpoints", async () => {
  const response = await fetch(`${origin}/api/v1`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Electronics E-Commerce API");
  assert.equal(body.data.products, "/api/v1/products");
  assert.equal(body.data.banners, "/api/v1/banners");
});

test("health route reports database availability", async () => {
  const response = await fetch(`${origin}/api/v1/health`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.equal(body.message, "Database unavailable");
  assert.equal(body.data.database, "disconnected");
});

test("unmatched API routes return a JSON 404 when MongoDB is disconnected", async () => {
  const response = await fetch(`${origin}/api/v1/not-a-route`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.message, "Route not found");
});

test("database-dependent routes report service unavailable when MongoDB is disconnected", async () => {
  const response = await fetch(`${origin}/api/v1/admin/products`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("public banner route reports database availability when MongoDB is disconnected", async () => {
  const response = await fetch(`${origin}/api/v1/banners`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("category management endpoints report database availability before authentication", async () => {
  const requests = [
    fetch(`${origin}/api/v1/admin/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/categories/507f1f77bcf86cd799439011`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/categories/507f1f77bcf86cd799439011`, {
      method: "DELETE",
    }),
    fetch(`${origin}/api/v1/admin/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/brands/507f1f77bcf86cd799439011`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/brands/507f1f77bcf86cd799439011`, {
      method: "DELETE",
    }),
  ];
  const responses = await Promise.all(requests);
  assert.deepEqual(
    responses.map((response) => response.status),
    [503, 503, 503, 503, 503, 503],
  );
});

test("banner management endpoints report database availability before authentication", async () => {
  const requests = [
    fetch(`${origin}/api/v1/admin/banners`, { method: "GET" }),
    fetch(`${origin}/api/v1/admin/banners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/banners/507f1f77bcf86cd799439011`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }),
    fetch(`${origin}/api/v1/admin/banners/507f1f77bcf86cd799439011`, {
      method: "DELETE",
    }),
  ];
  const responses = await Promise.all(requests);
  assert.deepEqual(
    responses.map((response) => response.status),
    [503, 503, 503, 503],
  );
});

test("refresh route reports database availability before checking cookies", async () => {
  const response = await fetch(`${origin}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("Google sign-in reports database availability before checking credentials", async () => {
  const response = await fetch(`${origin}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("payment session creation reports database availability before authentication", async () => {
  const response = await fetch(
    `${origin}/api/v1/payments/sslcommerz/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [], shippingAddress: {} }),
    },
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("payment status reports database availability before authentication", async () => {
  const response = await fetch(
    `${origin}/api/v1/payments/sslcommerz/ES123/status`,
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("customer order history reports database availability before authentication", async () => {
  const response = await fetch(`${origin}/api/v1/orders`);
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("admin order management reports database availability before authentication", async () => {
  const response = await fetch(
    `${origin}/api/v1/admin/orders/507f1f77bcf86cd799439011/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderStatus: "shipped",
        tracking: { trackingNumber: "TRACK-100" },
      }),
    },
  );
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(
    body.message,
    "Database unavailable; this endpoint requires a database connection",
  );
});

test("malformed request JSON returns a client error", async () => {
  const response = await fetch(`${origin}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.message, "Invalid JSON body");
});


test("newsletter subscriptions report database availability when MongoDB is disconnected", async () => {
  const response = await fetch(`${origin}/api/v1/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "customer@example.com" }),
  });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.success, false);
  assert.equal(body.message, "Database unavailable; this endpoint requires a database connection");
});
