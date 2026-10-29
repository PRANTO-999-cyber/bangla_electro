# Architecture

## Runtime components

- `apps/storefront` is a React/Vite customer application. It reads the public catalog from the API, keeps the current cart in browser storage, and submits product identifiers and quantities to the API at checkout.
- `apps/admin` is a React/Vite operations console. It uses the API's rotating HTTP-only refresh cookie and short-lived bearer access token. It does not keep an independent copy of editable commerce records.
- `apps/api` is an Express service. MongoDB/Mongoose is authoritative for users, products, categories, brands, banners, orders, payments, inventory, reviews, and coupons.
- `docker-compose.yml` starts the local MongoDB dependency. The API and Vite applications run from pnpm workspace scripts.
- `database/seed/catalog.mjs` idempotently inserts the sample catalog for development.
- Storefront catalog, customer order history, and large admin lists are fetched in bounded pages. MongoDB indexes support the common catalog, customer/order, and reservation-expiry queries.

## API boundaries

Public catalog routes provide active products, categories, brands, scheduled storefront banners, and approved product reviews. Admins manage banner image URLs, schedules, and placement in the large left slot or either right-side slot of the home-page banner grid. Authentication provides customer registration/login and refresh-token rotation. Admin routes require both a valid authenticated account and the `admin` role. The API provisions the initial administrator from `ADMIN_EMAIL` and `ADMIN_PASSWORD` during startup.

Checkout reads prices and available stock from MongoDB, creates an order and payment record, reserves stock while payment is pending, then confirms or releases the reservation based on the payment result or expiration. Payment callbacks must be reachable at `API_PUBLIC_URL`.

## Local startup

Follow the repository root [README](../README.md) for environment setup, MongoDB startup, sample-data seeding, and development commands. No Redis, email, cloud storage, or shipping integration is required by the currently implemented flows.

## Scaling boundaries

The current workspace is suitable as a modular monolith for development and an initial deployment. It is not yet configured for horizontally scaled production traffic: API rate limiting uses the default in-process store, reservation cleanup is an in-process timer, and there is no shared cache, queue, or production observability setup. Before running multiple API instances, move rate limiting and scheduled/background work to shared services, configure production MongoDB capacity and backups, and validate the deployment with load tests. Keep image assets on a CDN or object store as the catalog grows.

## Scope notes

Coupon CRUD exists in admin, but coupon redemption is not yet part of checkout. Storefront cart state is browser-local until checkout, and customer review submission, wishlist persistence, product-variant selection, refunds, and shipping-label integrations are not implemented as end-user flows. These should be treated as future work rather than as already-active features.
