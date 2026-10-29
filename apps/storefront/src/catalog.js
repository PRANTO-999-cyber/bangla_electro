export const CATALOG_PAGE_SIZE = 24;

export function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-|-$/g, '');
}

export function categoriesFromProducts(products) {
  const categories = new Map();
  for (const product of products) {
    if (!product.category) continue;
    const slug = product.categorySlug || slugify(product.category);
    if (!categories.has(slug)) categories.set(slug, { name: product.category, slug });
  }
  return [...categories.values()];
}

export function categoryPresentation(name, image = '') {
  const normalizedName = String(name || '').toLowerCase();
  if (/phone|mobile|smartphone|মোবাইল/.test(normalizedName)) {
    return {
      image: image || 'photo-1511707171634-5f897ff02aa9',
      caption: 'প্রতিদিন আরও স্মার্ট',
    };
  }
  if (/computer|laptop|tablet|pc|কম্পিউটার|ল্যাপটপ/.test(normalizedName)) {
    return {
      image: image || 'photo-1496181133206-80ce9b88a853',
      caption: 'বড় ভাবনার জন্য প্রযুক্তি',
    };
  }
  if (/mouse|মাউস/.test(normalizedName)) {
    return {
      image: image || 'photo-1527814050087-3793815479db',
      caption: 'প্রতিটি ক্লিকে নিখুঁততা',
    };
  }
  if (/light|lamp|bulb|লাইট/.test(normalizedName)) {
    return {
      image: image || 'photo-1507473885765-e6ed057f782c',
      caption: 'আরও উজ্জ্বল প্রতিদিন',
    };
  }
  if (/e-?books?|digital books?|ই-বুক/.test(normalizedName)) {
    return {
      image: image || 'photo-1544947950-fa07a98d237f',
      caption: 'নতুন ভাবনার সংগ্রহ',
    };
  }
  if (/audio|headphone|sound|speaker|অডিও/.test(normalizedName)) {
    return {
      image: image || 'photo-1505740420928-5e560c06d30e',
      caption: 'আপনার পছন্দের সাউন্ড',
    };
  }
  if (/watch|wearable|স্মার্টওয়াচ/.test(normalizedName)) {
    return {
      image: image || 'photo-1523275335684-37898b6baf30',
      caption: 'ছন্দে থাকুন',
    };
  }
  if (/camera|photo|ক্যামেরা/.test(normalizedName)) {
    return {
      image: image || 'photo-1516035069371-29a1b244cc32',
      caption: 'নতুন দৃষ্টিভঙ্গি ধারণ করুন',
    };
  }
  return {
    image: image || 'photo-1498049794561-7780e7231661',
    caption: 'প্রতিদিনের জন্য বাছাইকৃত প্রযুক্তি',
  };
}

export function mapApiProduct(product) {
  const categoryData = product.category && typeof product.category === 'object' ? product.category : null;
  const category = categoryData?.name || product.category;
  const brand = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const color = { Phones: 'lavender', Mouse: 'blue', Lights: 'orange', 'E-books': 'purple', Audio: 'peach', Accessories: 'sand' }[category] || 'mint';
  return {
    id: product.slug,
    databaseId: product._id,
    name: product.name,
    category: category || 'ইলেকট্রনিক্স',
    categorySlug: categoryData?.slug || categoryData?._id || slugify(category),
    brand: brand || 'ইলেক্ট্রোস্টোর',
    price: Number(product.basePrice || 0),
    oldPrice: null,
    rating: Number(product.rating || 0),
    reviews: Number(product.reviewCount || 0),
    badge: product.featured ? 'বিশেষ পণ্য' : null,
    image: Array.isArray(product.images) ? product.images[0] : '',
    description: product.shortDescription || product.description || 'প্রতিদিনের ব্যবহারের জন্য যত্নসহকারে বাছাই করা প্রযুক্তি.',
    color,
    stock: Number(product.stock || 0),
    createdAt: product.createdAt || '',
  };
}

export function mergeCatalogProducts(existing, incoming) {
  const productsById = new Map(existing.map((product) => [product.id, product]));
  for (const product of incoming) productsById.set(product.id, product);
  return [...productsById.values()];
}

export function filterCatalogProducts(products, { category = '', query = '', sort = 'featured' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = products.filter((product) => (
    (!category || (product.categorySlug || slugify(product.category)) === category)
    && `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalizedQuery)
  ));
  const comparators = {
    newest: (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  };
  return comparators[sort] ? filtered.sort(comparators[sort]) : filtered;
}

export async function fetchCatalogPage({
  apiUrl,
  page = 1,
  limit = CATALOG_PAGE_SIZE,
  category = '',
  query = '',
  sort = 'featured',
  signal,
  fetchImpl = fetch,
}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) params.set('category', category);
  if (query.trim()) params.set('q', query.trim());
  const apiSort = { 'price-low': 'price-asc', 'price-high': 'price-desc' }[sort] || sort;
  if (apiSort !== 'featured') params.set('sort', apiSort);

  const response = await fetchImpl(`${apiUrl}/products?${params}`, { signal });
  const result = await response.json();
  if (!response.ok || !result.success || !Array.isArray(result.data?.items)) {
    throw new Error(result.message || 'The product catalog is unavailable');
  }
  const pagination = result.data.pagination;
  if (!pagination || !Number.isInteger(pagination.page) || !Number.isInteger(pagination.pages)) {
    throw new Error('The product catalog returned invalid pagination data');
  }
  return {
    items: result.data.items.map(mapApiProduct),
    pagination,
  };
}
