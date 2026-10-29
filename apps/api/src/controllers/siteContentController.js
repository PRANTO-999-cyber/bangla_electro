import SiteContent from "../models/SiteContent.js";
import { fail, ok } from "../utils/response.js";

export const defaultSiteContent = {
  storeName: "ইলেক্ট্রোস্টোর",
  announcement: "সারা দেশে দ্রুত ডেলিভারি • নিরাপদ পেমেন্ট • বিশ্বস্ত সেবা",
  navHome: "হোম",
  navShop: "সব পণ্য",
  navCategories: "ক্যাটাগরি",
  navAbout: "আমাদের সম্পর্কে",
  navContact: "যোগাযোগ",
  searchPlaceholder: "পণ্য খুঁজুন...",
  hero1Kicker: "আপনার প্রতিদিনের প্রযুক্তি, আরও উন্নত",
  hero1Headline: "চালু করুন।",
  hero1Emphasis: "অনুভব করুন প্রতিটি মুহূর্ত।",
  hero1Description: "উন্নত শব্দ, আরামদায়ক ডিজাইন এবং সারাদিনের ব্যবহারের জন্য বেছে নিন আপনার পছন্দের হেডফোন।",
  hero1Button: "হেডফোন দেখুন",
  hero2Kicker: "প্রতিটি মুহূর্তের জন্য সাউন্ড",
  hero2Headline: "শব্দ বাড়ান",
  hero2Emphasis: "নিজের জগৎ সাজান।",
  hero2Description: "প্রিয় গান, পডকাস্ট ও কল উপভোগ করুন সমৃদ্ধ সাউন্ড এবং আরামদায়ক ফিটে।",
  hero2Button: "অডিও পণ্য দেখুন",
  hero3Kicker: "আপনার কাজের ছন্দে",
  hero3Headline: "আরও স্মার্টভাবে কাজ করুন।",
  hero3Emphasis: "স্বাভাবিকভাবে এগিয়ে চলুন।",
  hero3Description: "কাজ, পড়াশোনা ও বিনোদনের জন্য উপভোগ করুন মসৃণ নিয়ন্ত্রণ এবং আরামদায়ক ব্যবহার।",
  hero3Button: "মাউস দেখুন",
  featuredTitle: "বাছাই করা পণ্য",
  featuredDescription: "আপনার জন্য আমাদের পছন্দের প্রযুক্তি পণ্য",
  newArrivalsTitle: "নতুন এসেছে",
  newArrivalsDescription: "সদ্য যুক্ত হওয়া পণ্যগুলো এক নজরে দেখুন",
  addToCart: "কার্টে যোগ করুন",
  viewDetails: "বিস্তারিত দেখুন",
  footerAbout: "আপনার প্রতিদিনের প্রযুক্তির বিশ্বস্ত সঙ্গী।",
  footerSupport: "সহায়তা প্রয়োজন? আমাদের সঙ্গে যোগাযোগ করুন।",
  bdSectionEyebrow: "বাংলাদেশের ক্রেতাদের জন্য",
  bdSectionTitle: "সহজ কেনাকাটা, পরিষ্কার তথ্য",
  bdSectionDescription: "অর্ডার করার আগে ডেলিভারি চার্জ, পেমেন্ট ও সাপোর্ট সম্পর্কে জেনে নিন।",
  bdDeliveryTitle: "ডেলিভারি চার্জ",
  bdDeliveryDescription: "৳৫,০০০-এর কম অর্ডারে ৳১৫০; ৳৫,০০০ বা বেশি অর্ডারে ফ্রি।",
  bdPaymentTitle: "অনলাইন পেমেন্ট",
  bdPaymentDescription: "SSLCommerz পেমেন্ট চালু করতে API-তে মার্চেন্ট ক্রেডেনশিয়াল কনফিগার করুন।",
  bdSupportTitle: "সাপোর্টে যোগাযোগ",
  bdSupportDescription: "পণ্য বা অর্ডার সম্পর্কে WhatsApp-এ জিজ্ঞাসা করুন",
  checkoutEyebrow: "আর মাত্র এক ধাপ",
  checkoutTitle: "নিরাপদ চেকআউট",
  checkoutDescription: "SSLCommerz-এর নিরাপদ পেমেন্ট পেজে পেমেন্ট সম্পন্ন হবে।",
  checkoutDeliveryHeading: "ডেলিভারির তথ্য",
  checkoutNameLabel: "পূর্ণ নাম",
  checkoutNamePlaceholder: "আপনার নাম লিখুন",
  checkoutPhoneLabel: "মোবাইল নম্বর",
  checkoutPhoneTitle: "বাংলাদেশি মোবাইল নম্বর লিখুন, যেমন 01XXXXXXXXX",
  checkoutCityLabel: "শহর / জেলা",
  checkoutCityPlaceholder: "যেমন: ঢাকা",
  checkoutPostalLabel: "পোস্ট কোড (ঐচ্ছিক)",
  checkoutAddressLabel: "সম্পূর্ণ ডেলিভারি ঠিকানা",
  checkoutAddressPlaceholder: "বাড়ি, রোড, এলাকা, থানা",
  checkoutCouponLabel: "ডিসকাউন্ট কোড (ঐচ্ছিক)",
  checkoutCouponPlaceholder: "কুপন কোড লিখুন",
  checkoutPayButton: "নিরাপদ পেমেন্টে এগিয়ে যান",
  checkoutOrderTitle: "আপনার অর্ডার",
  checkoutSubtotalLabel: "আনুমানিক উপমোট",
  checkoutDisclaimer: "পেমেন্টের আগে ডিসকাউন্ট কোড, চূড়ান্ত মূল্য, ডেলিভারি ও স্টক যাচাই করা হবে।",
};

export async function getSiteContent(req, res) {
  try {
    const record = await SiteContent.findOne({ key: "storefront" }).lean();
    return ok(res, { ...defaultSiteContent, ...(record?.content || {}) });
  } catch (error) {
    return fail(res, "সাইটের কনটেন্ট লোড করা যায়নি।", 500);
  }
}

export async function updateSiteContent(req, res) {
  const content = req.body?.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return fail(res, "সঠিক কনটেন্ট অবজেক্ট দিন।", 400);
  }
  const safeContent = {};
  for (const [key, value] of Object.entries(content)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key) || typeof value !== "string") {
      return fail(res, "কনটেন্টের কোনো একটি ফিল্ড সঠিক নয়।", 400);
    }
    if (value.length > 5000) return fail(res, "প্রতিটি লেখার সর্বোচ্চ সীমা ৫০০০ অক্ষর।", 400);
    safeContent[key] = value.trim();
  }
  try {
    const record = await SiteContent.findOneAndUpdate(
      { key: "storefront" },
      { $set: { content: safeContent, updatedBy: req.user?._id } },
      { new: true, upsert: true, runValidators: true },
    ).lean();
    return ok(res, { ...defaultSiteContent, ...(record?.content || {}) }, "সাইটের লেখা সংরক্ষণ হয়েছে।");
  } catch {
    return fail(res, "সাইটের লেখা সংরক্ষণ করা যায়নি।", 500);
  }
}
