import { createRequire } from 'node:module';
import { connectDB } from '../../apps/api/src/config/db.js';
import Brand from '../../apps/api/src/models/Brand.js';
import Category from '../../apps/api/src/models/Category.js';
import Product from '../../apps/api/src/models/Product.js';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const mongoose = require('mongoose');

const categories = [
  { name: 'মোবাইল', slug: 'phones', description: 'স্মার্টফোন ও মোবাইলের প্রয়োজনীয় পণ্য।', image: 'photo-1511707171634-5f897ff02aa9' },
  { name: 'কম্পিউটার', slug: 'computers', description: 'কম্পিউটার, মনিটর ও পেরিফেরাল পণ্য।', image: 'photo-1527814050087-3793815479db' },
  { name: 'লাইট', slug: 'lights', description: 'কাজ ও ঘরের জন্য স্মার্ট আলোকসজ্জা।', image: 'photo-1507473885765-e6ed057f782c' },
  { name: 'ই-বুক', slug: 'ebooks', description: 'প্রযুক্তি বিষয়ক বই ও গাইড।', image: 'photo-1544947950-fa07a98d237f' },
  { name: 'অডিও', slug: 'audio', description: 'হেডফোন, স্পিকার ও অডিও পণ্য।', image: 'photo-1505740420928-5e560c06d30e' },
  { name: 'অ্যাক্সেসরিজ', slug: 'accessories', description: 'ডিভাইসের প্রয়োজনীয় আনুষঙ্গিক পণ্য।', image: 'photo-1498049794561-7780e7231661' },
];

const brands = [
  { name: 'Nova', slug: 'nova' },
  { name: 'Aero', slug: 'aero' },
  { name: 'Sonic', slug: 'sonic' },
  { name: 'ViewPlus', slug: 'viewplus' },
  { name: 'Pulse', slug: 'pulse' },
  { name: 'KeyLab', slug: 'keylab' },
  { name: 'Capture', slug: 'capture' },
  { name: 'Luma', slug: 'luma' },
  { name: 'PageTurn', slug: 'pageturn' },
];

const products = [
  { name: 'নোভা প্রো স্মার্টফোন', slug: 'nova-pro-smartphone', sku: 'PHN-NOVA-PRO', category: 'phones', brand: 'nova', basePrice: 89999, stock: 18, featured: true, images: ['photo-1511707171634-5f897ff02aa9'], shortDescription: 'দৈনন্দিন ব্যবহারের জন্য উজ্জ্বল ডিসপ্লে ও উন্নত ক্যামেরা।' },
  { name: 'এরোবুক ১৪ আল্ট্রা ল্যাপটপ', slug: 'aerobook-14-ultra', sku: 'COM-AERO-14', category: 'computers', brand: 'aero', basePrice: 129999, stock: 12, featured: true, images: ['photo-1496181133206-80ce9b88a853'], shortDescription: 'কাজ ও ভ্রমণের জন্য শক্তিশালী ও হালকা ল্যাপটপ।' },
  { name: 'স্টুডিও ওয়্যারলেস হেডফোন', slug: 'studio-wireless-headphones', sku: 'AUD-STUDIO-WL', category: 'audio', brand: 'sonic', basePrice: 15999, stock: 24, featured: true, images: ['photo-1505740420928-5e560c06d30e'], shortDescription: 'আরামদায়ক ওয়্যারলেস ব্যবহারে সমৃদ্ধ ও স্পষ্ট সাউন্ড।' },
  { name: 'এয়ারবিট প্রো ইয়ারবাডস', slug: 'airbeat-pro-earbuds', sku: 'AUD-AIRBEAT-PRO', category: 'audio', brand: 'sonic', basePrice: 5999, stock: 32, featured: true, images: ['photo-1606220945770-b5b6c2c55bf1'], shortDescription: 'স্পষ্ট কল ও পকেটে রাখা যায় এমন কেসসহ ছোট ইয়ারবাডস।' },
  { name: 'সনিক পোর্টেবল ব্লুটুথ স্পিকার', slug: 'sonic-portable-bluetooth-speaker', sku: 'AUD-SONIC-BT-01', category: 'audio', brand: 'sonic', basePrice: 8499, stock: 20, featured: true, images: ['photo-1608043152269-423dbba4e7e1'], shortDescription: 'ঘরজুড়ে সাউন্ড ও দীর্ঘস্থায়ী ব্যাটারিসহ ছোট ব্লুটুথ স্পিকার।' },
  { name: 'নোভা লাইট স্মার্টফোন', slug: 'nova-lite-smartphone', sku: 'PHN-NOVA-LITE', category: 'phones', brand: 'nova', basePrice: 32999, stock: 15, featured: false, images: ['photo-1511707171634-5f897ff02aa9'], shortDescription: 'উজ্জ্বল ডিসপ্লে, নির্ভরযোগ্য ক্যামেরা ও মসৃণ পারফরম্যান্স।' },
  { name: 'নোভা ট্যাব ১০', slug: 'nova-tab-10', sku: 'PHN-NOVA-TAB-10', category: 'phones', brand: 'nova', basePrice: 27999, stock: 11, featured: false, images: ['photo-1544244015-0df4b3ffc6b0'], shortDescription: 'ভিডিও দেখা, পড়া ও কাজের জন্য বহুমুখী ১০ ইঞ্চি ট্যাবলেট।' },
  { name: 'ভিউপ্লাস ৪কে মনিটর', slug: 'viewplus-4k-monitor', sku: 'COM-VIEW-4K', category: 'computers', brand: 'viewplus', basePrice: 38999, stock: 8, featured: false, images: ['photo-1527443224154-c4a3942d3acf'], shortDescription: 'আপনার ডেস্কের জন্য স্পষ্ট ৪কে রেজোলিউশন ও নির্ভুল রঙ।' },
  { name: 'লুমাগ্লো স্মার্ট ডেস্ক ল্যাম্প', slug: 'lumaglow-smart-desk-lamp', sku: 'LGT-LUMA-DESK', category: 'lights', brand: 'luma', basePrice: 6499, stock: 20, featured: true, images: ['photo-1507473885765-e6ed057f782c'], shortDescription: 'সহজ স্মার্ট কন্ট্রোলসহ উষ্ণ থেকে শীতল আলো সমন্বয়ের সুবিধা।' },
  { name: 'লুমাকালার স্মার্ট বাল্ব', slug: 'lumacolor-smart-bulb', sku: 'LGT-LUMA-BULB', category: 'lights', brand: 'luma', basePrice: 1899, stock: 40, featured: false, images: ['photo-1507473885765-e6ed057f782c'], shortDescription: 'আলোর উজ্জ্বলতা ও অ্যাপ থেকে সহজ নিয়ন্ত্রণে পরিবেশ সাজান।' },
  { name: 'প্রযুক্তি ব্যবহারের সহায়িকা', slug: 'thoughtful-tech-handbook', sku: 'BK-PAGE-TECH-01', category: 'ebooks', brand: 'pageturn', basePrice: 1299, stock: 25, featured: true, images: ['photo-1544947950-fa07a98d237f'], shortDescription: 'দৈনন্দিন প্রযুক্তি বেছে নেওয়া ও যত্নের মূল গাইড। মুদ্রিত বই আপনার ঠিকানায় পাঠানো হবে।' },
  { name: 'সহজভাবে দৈনন্দিন ইলেকট্রনিক্স', slug: 'everyday-electronics-made-simple', sku: 'BK-PAGE-ELEC-02', category: 'ebooks', brand: 'pageturn', basePrice: 999, stock: 30, featured: false, images: ['photo-1512820790803-83ca734da794'], shortDescription: 'দৈনন্দিন ইলেকট্রনিক্স বোঝার সহজ প্রাথমিক গাইড। মুদ্রিত বই আপনার ঠিকানায় পাঠানো হবে।' },
  { name: 'পালস অ্যাক্টিভ স্মার্টওয়াচ', slug: 'pulse-active-watch', sku: 'ACC-PULSE-WATCH', category: 'accessories', brand: 'pulse', basePrice: 11999, stock: 16, featured: false, images: ['photo-1523275335684-37898b6baf30'], shortDescription: 'স্বাস্থ্যসংক্রান্ত তথ্য ও নোটিফিকেশনসহ স্পষ্ট ডিসপ্লে।' },
  { name: 'পালস ২০,০০০ এমএএইচ পাওয়ার ব্যাংক', slug: 'pulse-20000mah-power-bank', sku: 'ACC-PULSE-PB20', category: 'accessories', brand: 'pulse', basePrice: 4299, stock: 28, featured: false, images: ['photo-1609091839311-d5365f9ff1c5'], shortDescription: 'ফোন ও দৈনন্দিন ডিভাইস চার্জের জন্য বহনযোগ্য ব্যাকআপ পাওয়ার।' },
  { name: 'এরো ৬৫ ওয়াট ইউএসবি-সি চার্জার', slug: 'aero-65w-usb-c-charger', sku: 'ACC-AERO-65W', category: 'accessories', brand: 'aero', basePrice: 3499, stock: 35, featured: false, images: ['photo-1609592806596-b43bada2f6db'], shortDescription: 'সামঞ্জস্যপূর্ণ ল্যাপটপ, ট্যাবলেট ও স্মার্টফোনের জন্য ছোট ফাস্ট চার্জার।' },
  { name: 'মেককি কমপ্যাক্ট কিবোর্ড', slug: 'mechkey-compact-keyboard', sku: 'ACC-MECHKEY-C', category: 'accessories', brand: 'keylab', basePrice: 7499, stock: 31, featured: false, images: ['photo-1587829741301-dc798b83add3'], shortDescription: 'কমপ্যাক্ট নকশার আরামদায়ক মেকানিক্যাল কিবোর্ড।' },
  { name: 'ক্যাপচার এক্স মিররলেস ক্যামেরা', slug: 'capture-x-mirrorless-camera', sku: 'ACC-CAPTURE-X', category: 'accessories', brand: 'capture', basePrice: 67999, stock: 6, featured: false, images: ['photo-1516035069371-29a1b244cc32'], shortDescription: 'স্পষ্ট ছবি ও ভিডিওর জন্য বহুমুখী মিররলেস ক্যামেরা।' },
];

await connectDB();
try {
  const categoryIds = new Map();
  for (const category of categories) {
    const saved = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $setOnInsert: category },
      { upsert: true, new: true, runValidators: true },
    );
    categoryIds.set(category.slug, saved._id);
  }

  // Repair legacy seed data that incorrectly placed laptop and monitor products in the mouse category.
  await Product.updateMany(
    { slug: { $in: ['aerobook-14-ultra', 'viewplus-4k-monitor'] } },
    { $set: { category: categoryIds.get('computers') } },
  );

  const brandIds = new Map();
  for (const brand of brands) {
    const saved = await Brand.findOneAndUpdate(
      { slug: brand.slug },
      { $setOnInsert: brand },
      { upsert: true, new: true, runValidators: true },
    );
    brandIds.set(brand.slug, saved._id);
  }

  let insertedProducts = 0;
  for (const product of products) {
    const { category, brand, ...details } = product;
    const result = await Product.updateOne(
      { slug: product.slug },
      { $setOnInsert: { ...details, category: categoryIds.get(category), brand: brandIds.get(brand) } },
      { upsert: true, runValidators: true },
    );
    if (result.upsertedCount) insertedProducts += 1;
  }
  console.log(`Catalog seed complete. ${categories.length} categories, ${brands.length} brands, ${insertedProducts} new products.`);
} finally {
  await mongoose.disconnect();
}
