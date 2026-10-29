import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CATALOG_PAGE_SIZE,
  categoriesFromProducts,
  categoryPresentation,
  fetchCatalogPage,
  filterCatalogProducts,
  mapApiProduct,
  mergeCatalogProducts,
  slugify,
} from '../src/catalog.js';

test('slugify normalizes category names for URLs', () => {
  assert.equal(slugify('  Home & Office  '), 'home-office');
  assert.equal(slugify(''), '');
  assert.equal(slugify('কম্পিউটার ও ল্যাপটপ'), 'কম্পিউটার-ও-ল্যাপটপ');
});

test('categoriesFromProducts preserves category slugs and removes duplicates', () => {
  assert.deepEqual(categoriesFromProducts([
    { category: 'Audio', categorySlug: 'sound' },
    { category: 'Audio', categorySlug: 'sound' },
    { category: 'Accessories', categorySlug: 'category-id' },
  ]), [
    { name: 'Audio', slug: 'sound' },
    { name: 'Accessories', slug: 'category-id' },
  ]);
});

test('categoryPresentation provides category-appropriate background art and honors uploaded images', () => {
  assert.deepEqual(categoryPresentation('Mouse'), {
    image: 'photo-1527814050087-3793815479db',
    caption: 'প্রতিটি ক্লিকে নিখুঁততা',
  });
  assert.deepEqual(categoryPresentation('Lights'), {
    image: 'photo-1507473885765-e6ed057f782c',
    caption: 'আরও উজ্জ্বল প্রতিদিন',
  });
  assert.deepEqual(categoryPresentation('E-books'), {
    image: 'photo-1544947950-fa07a98d237f',
    caption: 'নতুন ভাবনার সংগ্রহ',
  });
  assert.deepEqual(categoryPresentation('Audio'), {
    image: 'photo-1505740420928-5e560c06d30e',
    caption: 'আপনার পছন্দের সাউন্ড',
  });
  assert.deepEqual(categoryPresentation('Accessories', '/uploads/accessories.jpg'), {
    image: '/uploads/accessories.jpg',
    caption: 'প্রতিদিনের জন্য বাছাইকৃত প্রযুক্তি',
  });
});

test('mapApiProduct maps populated catalog fields to storefront fields', () => {
  const product = mapApiProduct({
    _id: 'product-id',
    slug: 'wireless-headphones',
    name: 'Wireless Headphones',
    category: { name: 'Audio', slug: 'audio' },
    brand: { name: 'Sonic' },
    basePrice: 1200,
    stock: 4,
    images: ['/headphones.jpg'],
    createdAt: '2026-10-01T00:00:00.000Z',
  });

  assert.equal(product.id, 'wireless-headphones');
  assert.equal(product.category, 'Audio');
  assert.equal(product.categorySlug, 'audio');
  assert.equal(product.brand, 'Sonic');
  assert.equal(product.price, 1200);
  assert.equal(product.stock, 4);
  assert.equal(product.image, '/headphones.jpg');
});

test('mapApiProduct uses the category ID when the category has no slug', () => {
  const product = mapApiProduct({
    slug: 'adapter',
    name: 'Adapter',
    category: { _id: 'category-id', name: 'Adapters' },
  });

  assert.equal(product.categorySlug, 'category-id');
});

test('mergeCatalogProducts appends new products and replaces duplicates without duplication', () => {
  const existing = [{ id: 'one', name: 'Old name' }];
  const merged = mergeCatalogProducts(existing, [
    { id: 'two', name: 'Second' },
    { id: 'one', name: 'Updated name' },
  ]);

  assert.deepEqual(merged, [
    { id: 'one', name: 'Updated name' },
    { id: 'two', name: 'Second' },
  ]);
});

test('filterCatalogProducts applies category, search, and sort to preview catalogs', () => {
  const products = [
    { id: 'older', name: 'Audio One', brand: 'Sonic', category: 'Audio', categorySlug: 'audio', price: 20, rating: 4, createdAt: '2026-01-01' },
    { id: 'newer', name: 'Audio Two', brand: 'Sonic', category: 'Audio', categorySlug: 'audio', price: 10, rating: 5, createdAt: '2026-02-01' },
    { id: 'phone', name: 'Phone', brand: 'Nova', category: 'Phones', categorySlug: 'phones', price: 5, rating: 3, createdAt: '2026-03-01' },
  ];

  assert.deepEqual(
    filterCatalogProducts(products, { category: 'audio', query: ' sonic ', sort: 'price-low' }).map((product) => product.id),
    ['newer', 'older'],
  );
  assert.deepEqual(
    filterCatalogProducts(products, { sort: 'newest' }).map((product) => product.id),
    ['phone', 'newer', 'older'],
  );
});

test('fetchCatalogPage sends filters and maps server pagination', async () => {
  let requestUrl;
  const result = await fetchCatalogPage({
    apiUrl: 'https://store.example/api/v1',
    page: 3,
    limit: CATALOG_PAGE_SIZE,
    category: 'home-office',
    query: ' desk ',
    sort: 'price-low',
    fetchImpl: async (url) => {
      requestUrl = new URL(url);
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            items: [{
              slug: 'standing-desk',
              name: 'Standing Desk',
              category: { name: 'Home & Office', slug: 'home-office' },
              basePrice: 800,
            }],
            pagination: { page: 3, limit: CATALOG_PAGE_SIZE, total: 55, pages: 3 },
          },
        }),
      };
    },
  });

  assert.equal(requestUrl.pathname, '/api/v1/products');
  assert.equal(requestUrl.searchParams.get('page'), '3');
  assert.equal(requestUrl.searchParams.get('limit'), String(CATALOG_PAGE_SIZE));
  assert.equal(requestUrl.searchParams.get('category'), 'home-office');
  assert.equal(requestUrl.searchParams.get('q'), 'desk');
  assert.equal(requestUrl.searchParams.get('sort'), 'price-asc');
  assert.equal(result.items[0].id, 'standing-desk');
  assert.equal(result.pagination.total, 55);
  assert.equal(result.pagination.pages, 3);
});

test('fetchCatalogPage omits default sort and validates API errors', async () => {
  let requestUrl;
  const fetchImpl = async (url) => {
    requestUrl = new URL(url);
    return {
      ok: false,
      json: async () => ({ success: false, message: 'Catalog unavailable' }),
    };
  };

  await assert.rejects(
    fetchCatalogPage({ apiUrl: 'https://store.example/api/v1', fetchImpl }),
    /Catalog unavailable/,
  );
  assert.equal(requestUrl.searchParams.has('sort'), false);
  assert.equal(requestUrl.searchParams.get('page'), '1');
});

test('fetchCatalogPage rejects malformed pagination data', async () => {
  await assert.rejects(
    fetchCatalogPage({
      apiUrl: 'https://store.example/api/v1',
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ success: true, data: { items: [], pagination: null } }),
      }),
    }),
    /invalid pagination data/,
  );
});
