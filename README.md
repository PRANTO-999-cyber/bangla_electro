# Electronics E-Commerce Platform

An electronics storefront and admin dashboard backed by an Express API and MongoDB, maintained as a pnpm workspace.

## Workspace

- `apps/storefront` — customer catalog, cart, account, and checkout UI.
- `apps/admin` — authenticated catalog, category, order, customer, inventory, review, and coupon management.
- `apps/api` — REST API, authentication, MongoDB persistence, order/payment flows, newsletter subscriptions, and admin endpoints.
- `database/seed/catalog.mjs` — idempotent starter catalog for a new database.

## Requirements

- Node.js 20 or newer.
- pnpm 10 (`corepack enable` can install the package-manager shim).
- Docker Desktop (or another Docker Compose provider) running.

## First-time local setup (PowerShell)

From the repository root:

```powershell
pnpm install
if (!(Test-Path apps\api\.env)) { Copy-Item apps\api\.env.example apps\api\.env }
```

If `apps\api\.env` already exists, keep it and edit only the values you need; the command above will not overwrite it. Set a unique `ADMIN_EMAIL`, a strong `ADMIN_PASSWORD`, and a random `JWT_ACCESS_SECRET` (at least 32 characters for production). The actual `.env` is ignored by Git.

Start MongoDB and wait for its health check:

```powershell
docker compose up -d mongo
docker compose ps
```

Create the sample categories, brands, and products in an empty database:

```powershell
pnpm --filter @shop/api seed
```

The seed is safe to rerun: it only inserts missing starter records and does not overwrite edits or existing catalog records.

Start all three apps:

```powershell
pnpm dev
```

- Storefront: <http://localhost:5173>
- Admin: <http://localhost:5174/admin>
- API health: <http://localhost:5000/api/v1/health>

Opening <http://localhost:5000> redirects to the admin dashboard at <http://localhost:5174/admin>. Open the storefront directly at <http://localhost:5173>. The API endpoint directory is available at <http://localhost:5000/api/v1>, and the health endpoint reports whether MongoDB is connected.

The API creates the configured administrator account on startup if it does not already exist. Sign in to the admin with the email and password from `apps/api/.env`; admin data is read from and saved to MongoDB, not browser storage.

If the admin reports that it cannot connect to the service, make sure MongoDB and the API are running and open the admin at exactly `http://localhost:5174/admin`. Both Vite apps use fixed ports and stop with a port-in-use error rather than silently moving to another port. If startup reports that a port is occupied, stop the process already using port 5173 (storefront) or 5174 (admin), then restart with `pnpm dev`. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_ACCESS_SECRET` together in `apps/api/.env` before starting the API. The API provisions that admin only when the account does not already exist; changing the environment password does not reset an existing account's password.

If `MONGO_URI` points to MongoDB Atlas, add the **public egress IP of the machine or hosting service running the API** under **Security → Network Access** in the correct Atlas project. Wait until the entry is active (not pending); a browser's IP or an IP from another network will not authorize the API. The database user in the URI must also have access to the selected database. If the API host has an outbound firewall, allow TCP ports `27015`–`27017` to the Atlas cluster hosts. Do not disable TLS or use `0.0.0.0/0` as a workaround. After changing Atlas access or firewall rules, restart the API and confirm `http://localhost:5000/api/v1/health` reports `"database":"connected"` before signing in. If the API still reports `503`, verify the Atlas project, active IP entry, database-user credentials/roles, and outbound firewall from the API host.

## Useful commands

```powershell
pnpm test
pnpm build
pnpm --filter @shop/api test
pnpm --filter @shop/api start
```

The API waits for MongoDB before listening. Its health endpoint returns `503` until MongoDB is connected. If `docker compose ps` cannot contact Docker, start Docker Desktop and retry.

## Configuration

The checked-in environment templates document the supported API settings. Do not commit `apps/api/.env` or put production secrets in a Vite environment file.

- `MONGO_URI` — MongoDB connection string; the template targets the local Compose database.
- `JWT_ACCESS_SECRET` — random signing key; use at least 32 random characters in production.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — initial administrator account provisioned by the API.
- `CLIENT_URL` / `ADMIN_URL` — allowed browser origins for credentialed API requests.
- `GOOGLE_CLIENT_ID` — optional Google OAuth web client ID used to verify storefront sign-ins. Set the same ID as `VITE_GOOGLE_CLIENT_ID` in `apps/storefront/.env.local`.
- `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` — optional payment credentials. Without them, checkout is unavailable.
- `SSLCOMMERZ_SANDBOX` — `true` for sandbox credentials; set `false` only with live credentials.
- `API_PUBLIC_URL` — public API origin used for payment callbacks. A local payment test needs a public HTTPS tunnel that forwards to port 5000.

Both Vite apps default to `http://localhost:5000/api/v1`. If the API is hosted elsewhere, create an ignored `apps/storefront/.env.local` and/or `apps/admin/.env.local` with `VITE_API_URL=https://your-api-host/api/v1`.

To enable Google sign-in, create an OAuth 2.0 Client ID of type **Web application** in Google Cloud Console. Add the storefront origin (for local development, `http://localhost:5173`) to its authorized JavaScript origins. Set `GOOGLE_CLIENT_ID` in `apps/api/.env` and the matching `VITE_GOOGLE_CLIENT_ID` in `apps/storefront/.env.local`, then restart the API and storefront. The API verifies Google's ID token before issuing the existing ElectroStore session; Google sign-in creates customer accounts and cannot grant administrator access.

Visitors can browse products and manage a cart without signing in. Authentication is required only when continuing from the cart to checkout; guests are redirected to sign in or create an account and then returned to checkout.

## Storefront quality and performance polish

- The storefront keeps the Bengali font stylesheet out of CSS `@import` and preconnects to the font origins, using `display=swap` to reduce text-blocking time.
- Non-critical product/banner images use lazy loading where appropriate and asynchronous image decoding; the primary hero image retains high fetch priority.
- Light/dark mode updates the browser theme color and native form color scheme as well as the storefront palette.
- Keyboard focus indicators are consistently visible, and reduced-motion preferences are respected.
- The storefront test suite can run without installing browser dependencies using `node --test apps/storefront/tests/*.js`; full API/build checks require `pnpm install` first.

## Bangladesh market notes

- Storefront copy and checkout labels are localized for Bangladesh; prices use Bangladeshi taka (৳) and Bengali number formatting.
- The current API calculates delivery as ৳150 for subtotals below ৳5,000 and free delivery for subtotals of ৳5,000 or more. Update the policy and UI together if the business changes this rule.
- Checkout currently starts through SSLCommerz only. Configure valid sandbox credentials and a public HTTPS callback URL before testing. Direct bKash/Nagad/Rocket merchant integrations and Cash on Delivery are **not** enabled by this code unless separately implemented and verified.
- The storefront WhatsApp support number is configured in `apps/storefront/src/App.jsx`. Replace it with the business-owned number before launch.
- Before accepting real orders, publish clear delivery timelines by area, warranty terms, return/refund rules, privacy policy, terms of service, and a support contact. Do not advertise a guarantee unless the business can honor it.
- Test mobile layouts and Bangladeshi phone inputs, inventory, coupons, payment callbacks, order confirmation, and refund handling with sandbox/test data before going live.

## Current commerce behavior

The API is authoritative for catalog records, checkout pricing, stock reservation, payment verification, and order status. The storefront's sample catalog is a display-only preview when the API is offline; checkout requires the live API and configured payment credentials. The admin is protected by API authentication and admin-role checks.

The admin can create percentage or fixed-amount coupons with optional minimum order values, maximum discount caps, active dates, and total/per-customer usage limits. Customers can enter a coupon during checkout; the API validates it against current catalog prices and applies the discount to the payment total. Cart contents are held in the storefront browser and are revalidated by the API when checkout begins. Payment callbacks require the API to be reachable at `API_PUBLIC_URL`.


## বাংলা স্টোরফ্রন্ট কনটেন্ট সম্পাদনা

অ্যাডমিন প্যানেলের **ওয়েবসাইটের লেখা** পেজ থেকে স্টোরের নাম, ঘোষণা, নেভিগেশন, সার্চ প্লেসহোল্ডার, তিনটি হিরো স্লাইড, পণ্য সেকশনের শিরোনাম, ফুটারের পরিচিতি, বাংলাদেশে ডেলিভারি/পেমেন্ট/সাপোর্ট তথ্য এবং চেকআউটের প্রধান শিরোনাম, লেবেল, প্লেসহোল্ডার ও নির্দেশনা সম্পাদনা করা যায়। **সব লেখা সংরক্ষণ করুন** চাপলে লেখা API-এর মাধ্যমে MongoDB-তে সেভ হয় এবং স্টোরফ্রন্ট API থেকে নতুন লেখা পড়ে দেখায়। খালি ফিল্ডের ক্ষেত্রে ডিফল্ট লেখা ব্যবহার হবে। কিছু সিস্টেম নোটিশ, validation/error message এবং পণ্যের নিজস্ব নাম/বিবরণ এখনও কোড বা আলাদা পণ্য-সম্পাদনা ফর্ম থেকে নিয়ন্ত্রিত—এই পেজটি প্রতিটি UI লেখার পূর্ণ অনুবাদ ব্যবস্থা নয়।

### চালানোর আগে

1. `apps/api/.env.example` কপি করে `apps/api/.env` তৈরি করুন।
2. আপনার নিজস্ব MongoDB URI, JWT secret এবং প্রয়োজনীয় OAuth/পেমেন্ট কনফিগারেশন পূরণ করুন।
3. রুটে `pnpm install` চালিয়ে তারপর `npm run dev` চালান।
4. অ্যাডমিনে লগইন করে **ওয়েবসাইটের লেখা** পেজ খুলুন। এই পেজ থেকে সংরক্ষিত কনটেন্ট MongoDB-তে রাখা হয়।

**নিরাপত্তা:** `.env` ফাইল ও প্রকৃত ক্রেডেনশিয়াল এই শেয়ার করা আর্কাইভে রাখা হয়নি। নিজের লোকাল `.env` ফাইল আলাদাভাবে তৈরি করুন; কোনো সিক্রেট Git-এ কমিট করবেন না।


## ব্যবসা চালুর আগে: আয় ও অপারেশন পরিকল্পনা

### ইতিমধ্যে থাকা বাণিজ্যিক ভিত্তি
- কাস্টমার স্টোরফ্রন্ট, ক্যাটাগরি/ব্র্যান্ডসহ পণ্য ক্যাটালগ, সার্চ ও সর্টিং।
- কার্ট, অ্যাকাউন্ট অথেনটিকেশন এবং চেকআউটের API-ভিত্তিক মূল্য/স্টক যাচাই।
- অ্যাডমিন ড্যাশবোর্ডে পণ্য, অর্ডার, কাস্টমার, ইনভেন্টরি, ব্যানার, রিভিউ ও কুপন ব্যবস্থাপনা।
- কুপন ভ্যালিডেশন, অর্ডার স্ট্যাটাস, Google sign-in-এর ঐচ্ছিক কনফিগারেশন এবং SSLCOMMERZ-এর ঐচ্ছিক পেমেন্ট ইন্টিগ্রেশন।
- স্টোরের কনটেন্ট অ্যাডমিন থেকে সম্পাদনা করার সুবিধা।

### আয়ের বাস্তবসম্মত ধাপ
1. **প্রথম ধাপ — নিজের স্টক/প্রি-অর্ডার:** অল্প কয়েকটি যাচাইকৃত পণ্য দিয়ে শুরু করুন; প্রতিটি পণ্যের ক্রয়মূল্য, প্যাকেজিং, ডেলিভারি, পেমেন্ট চার্জ ও সম্ভাব্য রিটার্ন হিসাব করে মূল্য নির্ধারণ করুন।
2. **দ্বিতীয় ধাপ — পুনরায় কেনাকাটা:** কাস্টমার সাপোর্ট, অর্ডার আপডেট, রিভিউ, কুপন ও ইমেইল/এসএমএস নোটিফিকেশনকে নির্ভরযোগ্য করুন।
3. **তৃতীয় ধাপ — স্কেল:** বিক্রয় ও লাভের রিপোর্ট, SEO, অ্যানালিটিক্স, অ্যাফিলিয়েট প্রোগ্রাম এবং পরে যাচাইকৃত ভেন্ডর-ভিত্তিক মার্কেটপ্লেস যোগ করুন।

### Production launch checklist
- [ ] `apps/api/.env`-এ বাস্তব MongoDB URI, অন্তত 32 অক্ষরের অনন্য JWT secret এবং শক্তিশালী admin credentials দিন।
- [ ] MongoDB Atlas হলে শুধু API সার্ভারের নির্দিষ্ট egress IP allowlist করুন; production-এ `0.0.0.0/0` ব্যবহার করবেন না।
- [ ] SSLCOMMERZ sandbox দিয়ে checkout ও payment callback পরীক্ষা করুন; লাইভ করার আগে অনুমোদিত live credentials দিন।
- [ ] Google OAuth-এর authorized origins ও callback/configuration যাচাই করুন।
- [ ] পণ্য, মূল্য, স্টক, ডেলিভারি চার্জ, রিটার্ন/রিফান্ড নীতি এবং যোগাযোগের তথ্য বাস্তব ব্যবসার তথ্য দিয়ে পূরণ করুন।
- [ ] HTTPS, database backup, error monitoring, rate limits, email delivery, privacy policy এবং terms of service যাচাই করুন।
- [ ] বাস্তব ক্রেতার টাকা নেওয়ার আগে সফল/ব্যর্থ পেমেন্ট, duplicate callback, stock reservation, cancelled order ও refund flow end-to-end পরীক্ষা করুন।

**গুরুত্বপূর্ণ:** এই রিপোজিটরিতে ফিচার ও ইন্টিগ্রেশনের কোড থাকলেও তা নিজে থেকেই লাইভ পেমেন্ট অ্যাকাউন্ট, ইমেইল ডেলিভারি, ব্যবসার লাইসেন্স, ট্রেডমার্ক বা আয়ের নিশ্চয়তা দেয় না। Production-এ প্রকাশের আগে বাস্তব credentials এবং end-to-end test বাধ্যতামূলক।


## Newsletter subscriptions

The storefront newsletter form now stores normalized email addresses in MongoDB instead of showing a local-only success message. The public endpoint is `POST /api/v1/newsletter/subscribe` with `{ "email": "customer@example.com" }`; it validates the address, prevents duplicate subscriptions, and applies a per-IP rate limit. Admin-authenticated users can review paginated subscribers at `GET /api/v1/admin/newsletter/subscribers?page=1&limit=25` (optional `status=unsubscribed` filter). Newsletter delivery and unsubscribe emails are not enabled until an email provider and a consent/unsubscribe workflow are configured; do not treat collecting a subscriber as permission to send unrelated marketing.

## Additional launch-readiness updates

- Added a web app manifest and crawler rules for the storefront; private checkout/account paths and the admin path are excluded from crawling.
- Added loading, error, and accessible status feedback to newsletter signup.
- Newsletter subscription records use normalized unique emails and an indexed status/date query for admin review.


## Premium product comparison (added)

- Product cards now have a compare control. Select up to three products and compare category, brand, price, rating, stock information, description, and product detail links in a responsive comparison sheet.
- The comparison selection persists in browser local storage between visits. It is a shopping aid only; checkout continues to validate price and inventory against the API.
- Compare controls are available on the home page and shop catalog. Remove individual items using the selected compare control, or clear the selection from the comparison dock.
