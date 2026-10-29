import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Headphones,
  Laptop,
  Lightbulb,
  Mail,
  Menu,
  MessageCircle,
  Mouse,
  Minus,
  Moon,
  Sun,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
  Watch,
  X,
} from "lucide-react";
import { API_URL, fetchWithAuth, refreshSession } from "./services/api.js";
import {
  CATALOG_PAGE_SIZE,
  categoriesFromProducts,
  categoryPresentation,
  fetchCatalogPage,
  filterCatalogProducts,
  mapApiProduct,
  mergeCatalogProducts,
  slugify,
} from "./catalog.js";

const CART_KEY = "electrostore-storefront-cart-v1";
const WHATSAPP_NUMBER = "8801612055153";
const WHATSAPP_DISPLAY_NUMBER = "+8801612055153";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";
const products = [
  {
    id: "phone-pro",
    name: "নোভা প্রো স্মার্টফোন",
    category: "মোবাইল",
    brand: "Nova",
    price: 89999,
    oldPrice: 99999,
    rating: 4.9,
    reviews: 128,
    badge: "সর্বাধিক বিক্রিত",
    image: "photo-1511707171634-5f897ff02aa9",
    description:
      "প্রান্তজুড়ে উজ্জ্বল ডিসপ্লে, উন্নত ক্যামেরা এবং সারাদিনের পারফরম্যান্স—সবই ভারসাম্যপূর্ণ নকশায়।",
    color: "lavender",
  },
  {
    id: "ultra-laptop",
    name: "এরোবুক ১৪ আল্ট্রা ল্যাপটপ",
    category: "computers",
    brand: "Aero",
    price: 129999,
    oldPrice: 144999,
    rating: 4.8,
    reviews: 86,
    badge: "৳১৫,০০০ সাশ্রয়",
    image: "photo-1496181133206-80ce9b88a853",
    description:
      "শক্তিশালী ও হালকা ল্যাপটপ, যেকোনো জায়গায় ব্যবহারের উপযোগী। উজ্জ্বল ডিসপ্লে ও দ্রুত মাল্টিটাস্কিং উপভোগ করুন।",
    color: "sand",
  },
  {
    id: "headphones",
    name: "স্টুডিও ওয়্যারলেস হেডফোন",
    category: "audio",
    brand: "Sonic",
    price: 15999,
    oldPrice: 18999,
    rating: 4.9,
    reviews: 214,
    badge: "সর্বোচ্চ রেটিং",
    image: "photo-1505740420928-5e560c06d30e",
    description:
      "অভিযোজিত নয়েজ ক্যানসেলেশন ও আরামদায়ক ফিটের মাধ্যমে উপভোগ করুন সমৃদ্ধ ও স্পষ্ট সাউন্ড।",
    color: "peach",
  },
  {
    id: "earbuds",
    name: "এয়ারবিট প্রো ইয়ারবাডস",
    category: "audio",
    brand: "Sonic",
    price: 5999,
    oldPrice: 6999,
    rating: 4.7,
    reviews: 173,
    badge: "জনপ্রিয়",
    image: "photo-1606220945770-b5b6c2c55bf1",
    description:
      "স্পষ্ট কল, ভারসাম্যপূর্ণ অডিও এবং পকেটে রাখা যায় এমন চার্জিং কেসসহ ছোট ওয়্যারলেস ইয়ারবাডস।",
    color: "mint",
  },
  {
    id: "monitor",
    name: "ভিউপ্লাস ৪কে মনিটর",
    category: "computers",
    brand: "ViewPlus",
    price: 38999,
    oldPrice: null,
    rating: 4.8,
    reviews: 64,
    badge: null,
    image: "photo-1527443224154-c4a3942d3acf",
    description:
      "স্পষ্ট ৪কে রেজোলিউশন, নির্ভুল রঙ এবং বর্ডারলেস নকশায় প্রতিটি বিবরণ উপভোগ করুন।",
    color: "blue",
  },
  {
    id: "smartwatch",
    name: "পালস অ্যাক্টিভ স্মার্টওয়াচ",
    category: "অ্যাক্সেসরিজ",
    brand: "Pulse",
    price: 11999,
    oldPrice: 13999,
    rating: 4.6,
    reviews: 92,
    badge: "নতুন",
    image: "photo-1523275335684-37898b6baf30",
    description:
      "স্বাস্থ্যসংক্রান্ত তথ্য, স্মার্ট নোটিফিকেশন ও সহজে পড়া যায় এমন ডিসপ্লেতে থাকুন সারাদিন ছন্দে।",
    color: "rose",
  },
  {
    id: "keyboard",
    name: "মেককি কমপ্যাক্ট কিবোর্ড",
    category: "অ্যাক্সেসরিজ",
    brand: "KeyLab",
    price: 7499,
    oldPrice: null,
    rating: 4.7,
    reviews: 51,
    badge: null,
    image: "photo-1587829741301-dc798b83add3",
    description:
      "কম জায়গায় মানানসই নকশা ও আরামদায়ক কী-সহ কাজ এবং বিনোদনের জন্য মেকানিক্যাল কিবোর্ড।",
    color: "blue",
  },
  {
    id: "camera",
    name: "ক্যাপচার এক্স মিররলেস ক্যামেরা",
    category: "অ্যাক্সেসরিজ",
    brand: "Capture",
    price: 67999,
    oldPrice: 72999,
    rating: 4.8,
    reviews: 37,
    badge: "সীমিত অফার",
    image: "photo-1516035069371-29a1b244cc32",
    description:
      "স্পষ্ট ছবি ও মসৃণ ভিডিওর জন্য তৈরি বহুমুখী মিররলেস ক্যামেরায় স্মরণীয় মুহূর্ত ধারণ করুন।",
    color: "sand",
  },
  {
    id: "thoughtful-tech-handbook",
    name: "প্রযুক্তি ব্যবহারের সহায়িকা",
    category: "ই-বুক",
    brand: "PageTurn",
    price: 1299,
    rating: 4.8,
    reviews: 12,
    badge: "মুদ্রিত সংস্করণ",
    image: "photo-1544947950-fa07a98d237f",
    description:
      "An original guide to choosing and caring for everyday technology. Printed edition; ships to your address.",
    color: "lavender",
  },
  {
    id: "everyday-electronics-made-simple",
    name: "সহজভাবে দৈনন্দিন ইলেকট্রনিক্স",
    category: "ই-বুক",
    brand: "PageTurn",
    price: 999,
    rating: 4.7,
    reviews: 8,
    badge: null,
    image: "photo-1512820790803-83ca734da794",
    description:
      "An original beginner-friendly guide to understanding the electronics you use every day. Printed edition; ships to your address.",
    color: "lavender",
  },
];

const heroSlides = [
  {
    kicker: "আপনার পছন্দের সাউন্ড",
    headline: "চালু করুন।",
    emphasis: "অনুভব করুন প্রতিটি মুহূর্ত।",
    description:
      "উন্নত শব্দ, আরামদায়ক ডিজাইন এবং সারাদিনের ব্যবহারের জন্য বেছে নিন আপনার পছন্দের হেডফোন।",
    image: "photo-1505740420928-5e560c06d30e",
    imageAlt: "স্টুডিও পরিবেশে প্রিমিয়াম ওভার-ইয়ার ওয়্যারলেস হেডফোন",
    productLabel: "০১ — উন্নত সাউন্ড",
    productName: "Studio Wireless",
    productDescription: "প্রতিদিনের জন্য আরও ভালো সাউন্ড।",
    category: "audio",
    buttonText: "হেডফোন দেখুন",
  },
  {
    kicker: "প্রতিটি মুহূর্তের জন্য সাউন্ড",
    headline: "শব্দ বাড়ান",
    emphasis: "নিজের জগৎ সাজান।",
    description:
      "সমৃদ্ধ সাউন্ড এবং আরামদায়ক ফিটে সারাদিন উপভোগ করুন গান, পডকাস্ট ও কল।",
    image: "/banner-headphones.jpg",
    imageAlt: "উজ্জ্বল হলুদ পটভূমিতে কালো ওভার-ইয়ার হেডফোন",
    productLabel: "০২ — চলমান সাউন্ড",
    productName: "স্টুডিও ওয়্যারলেস হেডফোন",
    productDescription: "সারাদিনের আরাম।",
    category: "audio",
    buttonText: "অডিও পণ্য দেখুন",
  },
  {
    kicker: "আপনার কাজের ছন্দে",
    headline: "আরও স্মার্টভাবে কাজ করুন।",
    emphasis: "স্বাভাবিকভাবে এগিয়ে চলুন।",
    description:
      "কাজ, পড়াশোনা ও বিনোদনের জন্য উপভোগ করুন মসৃণ নিয়ন্ত্রণ এবং আরামদায়ক ব্যবহার।",
    image: "/banner-mouse.jpg",
    imageAlt: "হালকা পটভূমিতে সাদা ওয়্যারলেস মাউস",
    productLabel: "০৩ — নিখুঁত নিয়ন্ত্রণ",
    productName: "Wireless Mouse",
    productDescription: "সারাদিন নিখুঁত নিয়ন্ত্রণ।",
    category: "computers",
    buttonText: "মাউস দেখুন",
  },
];

const formatPrice = (price) => `৳${Number(price).toLocaleString("bn-BD")}`;
const imageUrl = (image, width = 720) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return new URL(image, API_URL).toString();
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=85`;
};

async function fetchCatalogItems(path) {
  const response = await fetch(`${API_URL}${path}`);
  const result = await response.json();
  if (!response.ok || !result.success || !Array.isArray(result.data?.items)) {
    throw new Error(result.message || "লাইভ ক্যাটালগ পাওয়া যাচ্ছে না");
  }
  return result.data.items;
}

function readCart() {
  const saved = localStorage.getItem(CART_KEY);
  if (!saved) return [];
  const parsed = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error("সংরক্ষিত কার্টের তথ্য সঠিক নয়।");
  return parsed.filter(
    (item) =>
      typeof item.productId === "string" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0,
  );
}

function ProductImage({ product, className }) {
  const [failed, setFailed] = useState(!product.image);
  const src = failed
    ? imageUrl("photo-1498049794561-7780e7231661")
    : imageUrl(product.image);
  return (
    <div className={className}>
      {!failed && src && (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="image-fallback">
          <PackageCheck size={24} />
          <span>{product.category}</span>
        </div>
      )}
      {product.badge && <span className="product-badge">{product.badge}</span>}
    </div>
  );
}

function ProductCard({ product, onAdd, onCompare, compared }) {
  const outOfStock = product.stock !== undefined && product.stock < 1;
  return (
    <article className="product-card">
      <Link
        className="product-image-link"
        to={`/product/${product.id}`}
        aria-label={`${product.name} দেখুন`}
      >
        <ProductImage
          product={product}
          className={`product-image ${product.color}${outOfStock ? " sold-out" : ""}`}
        />
      </Link>
      <div className="product-details">
        <div className="product-meta">
          <span>{product.brand}</span>
          <span className="rating">
            <span>★</span> {product.rating}{" "}
            <span className="review-count">({product.reviews})</span>
          </span>
        </div>
        <Link to={`/product/${product.id}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-buyline">
          <div>
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
          </div>
          <button
            className={`compare-icon${compared ? " selected" : ""}`}
            type="button"
            aria-pressed={compared}
            aria-label={`${product.name} ${compared ? "তুলনা থেকে বাদ দিন" : "তুলনায় যোগ করুন"}`}
            onClick={() => onCompare(product.id)}
            title={compared ? "তুলনা থেকে বাদ দিন" : "পণ্য তুলনা করুন"}
          >
            <ArrowLeftRight size={15} />
          </button>
          <button
            className="add-icon"
            aria-label={
              outOfStock
                ? `${product.name} স্টকে নেই`
                : `কার্টে ${product.name} যোগ করুন`
            }
            disabled={outOfStock}
            onClick={() => onAdd(product.id)}
          >
            {outOfStock ? <X size={16} /> : <Plus size={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  items,
  onAdd,
  onCompare,
  comparedIds = [],
  empty = "আপনার সার্চের সঙ্গে মেলে এমন পণ্য নেই।",
}) {
  if (!items.length)
    return (
      <div className="empty-state">
        <Search size={25} />
        <p>{empty}</p>
      </div>
    );
  return (
    <div className="product-grid">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} onCompare={onCompare} compared={comparedIds.includes(product.id)} />
      ))}
    </div>
  );
}

function CatalogNotice({ live, loading }) {
  if (live || loading) return null;
  return (
    <div className="catalog-notice">
      <span className="catalog-notice-dot" />
      <span>
        <strong>ক্যাটালগ আপডেট</strong> · স্টোর সার্ভিস সংযুক্ত হলে লাইভ পণ্য ও চেকআউট ব্যবহার করা যাবে।
      </span>
    </div>
  );
}

function AccountStatus({ offline }) {
  return offline ? (
    <span className="account-offline" role="status">
      অ্যাকাউন্ট সেবা অফলাইন
    </span>
  ) : null;
}

function BangladeshShoppingInfo({ siteContent = {} }) {
  const text = (key, fallback) => siteContent[key] || fallback;
  return (
    <section className="bd-shopping-info" aria-label={text("bdSectionTitle", "বাংলাদেশে কেনাকাটার তথ্য")}>
      <div className="bd-shopping-intro">
        <span className="eyebrow">{text("bdSectionEyebrow", "বাংলাদেশের ক্রেতাদের জন্য")}</span>
        <h2>{text("bdSectionTitle", "সহজ কেনাকাটা, পরিষ্কার তথ্য")}</h2>
        <p>{text("bdSectionDescription", "অর্ডার করার আগে ডেলিভারি চার্জ, পেমেন্ট ও সাপোর্ট সম্পর্কে জেনে নিন।")}</p>
      </div>
      <div className="bd-info-card">
        <span className="bd-info-icon"><Truck size={20} /></span>
        <div><strong>{text("bdDeliveryTitle", "ডেলিভারি চার্জ")}</strong><p>{text("bdDeliveryDescription", "৳৫,০০০-এর কম অর্ডারে ৳১৫০; ৳৫,০০০ বা বেশি অর্ডারে ফ্রি।")}</p></div>
      </div>
      <div className="bd-info-card">
        <span className="bd-info-icon"><CreditCard size={20} /></span>
        <div><strong>{text("bdPaymentTitle", "অনলাইন পেমেন্ট")}</strong><p>{text("bdPaymentDescription", "SSLCommerz পেমেন্ট চালু করতে API-তে মার্চেন্ট ক্রেডেনশিয়াল কনফিগার করুন।")}</p></div>
      </div>
      <a className="bd-info-card bd-support-card" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
        <span className="bd-info-icon"><MessageCircle size={20} /></span>
        <div><strong>{text("bdSupportTitle", "সাপোর্টে যোগাযোগ")}</strong><p>{text("bdSupportDescription", "পণ্য বা অর্ডার সম্পর্কে WhatsApp-এ জিজ্ঞাসা করুন")}</p><small>{WHATSAPP_DISPLAY_NUMBER}</small></div>
        <ArrowRight size={16} />
      </a>
    </section>
  );
}

function HomePage({
  onAdd,
  onCompare,
  comparedIds,
  products,
  categories,
  banners,
  newArrivals,
  catalogLive,
  catalogLoading,
  siteContent = {},
}) {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const featured = products.filter((product) => product.badge).slice(0, 4);
  const displayedProducts = featured.length ? featured : products.slice(0, 4);
  const categoryItems = categories.length
    ? categories
    : categoriesFromProducts(products);
  const latestProducts = newArrivals.length
    ? newArrivals
    : [...products]
        .sort(
          (a, b) =>
            (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0),
        )
        .slice(0, 4);
  const managedSlots = banners.reduce((slots, banner) => {
    if (banner.image && !slots[banner.position])
      slots[banner.position] = banner;
    return slots;
  }, {});
  const hasManagedBanners = Object.keys(managedSlots).length > 0;
  const slides = heroSlides.map((slide, index) => {
    const n = index + 1;
    return {
      ...slide,
      kicker: siteContent[`hero${n}Kicker`] || slide.kicker,
      headline: siteContent[`hero${n}Headline`] || slide.headline,
      emphasis: siteContent[`hero${n}Emphasis`] || slide.emphasis,
      description: siteContent[`hero${n}Description`] || slide.description,
      buttonText: siteContent[`hero${n}Button`] || slide.buttonText,
    };
  });
  const activeSlideIndex = activeHeroSlide % slides.length;
  const heroSlide = slides.length ? slides[activeSlideIndex] : null;
  function moveHeroSlide(offset) {
    setActiveHeroSlide(
      (current) => (current + offset + slides.length) % slides.length,
    );
  }
  useEffect(() => {
    if (hasManagedBanners || heroPaused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % slides.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [hasManagedBanners, heroPaused, slides.length]);
  function renderBenefitsStrip(className = "benefits-strip") {
    return (
      <section className={className} aria-label="স্টোরের সুবিধাসমূহ">
        <div>
          <Truck size={19} />
          <span>
            <strong>বিনামূল্যে ডেলিভারি</strong>
            <small>৳৫,০০০ বা বেশি অর্ডারে</small>
          </span>
        </div>
        <div>
          <ShieldCheck size={19} />
          <span>
            <strong>অফিশিয়াল ওয়ারেন্টি</strong>
            <small>পণ্যের বিবরণে ওয়ারেন্টি দেখুন</small>
          </span>
        </div>
        <div>
          <PackageCheck size={19} />
          <span>
            <strong>রিটার্ন নীতিমালা</strong>
            <small>প্রযোজ্য শর্ত দেখে নিন</small>
          </span>
        </div>
        <div>
          <ShoppingBag size={19} />
          <span>
            <strong>নিরাপদ চেকআউট</strong>
            <small>পেমেন্ট গেটওয়ে-ভিত্তিক চেকআউট</small>
          </span>
        </div>
      </section>
    );
  }
  return (
    <>
      <CatalogNotice live={catalogLive} loading={catalogLoading} />
      {hasManagedBanners ? (
        <>
          <section className="store-banner-grid" aria-label="স্টোর ব্যানার">
            {[
              ["hero", "বড় ব্যানার"],
              ["promotion", "উপরের প্রচারমূলক ব্যানার"],
              ["service", "নিচের প্রচারমূলক ব্যানার"],
            ].map(([position, label]) => {
              const banner = managedSlots[position];
              const slotClass = position === "hero" ? "large" : position;
              const content = banner ? (
                <>
                  <img
                    src={
                      banner.image.startsWith("/")
                        ? banner.image
                        : imageUrl(banner.image, 1600)
                    }
                    alt={banner.title || label}
                    loading={position === "hero" ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={position === "hero" ? "high" : "auto"}
                  />
                </>
              ) : null;
              const safeLink =
                banner?.link &&
                (/^\/(?!\/)/.test(banner.link) ||
                  /^https?:\/\//i.test(banner.link));
              return safeLink ? (
                <a
                  className={`store-banner-tile ${slotClass}`}
                  href={banner.link}
                  key={position}
                  aria-label={banner.title || label}
                >
                  {content}
                </a>
              ) : (
                <div
                  className={`store-banner-tile ${slotClass}${banner ? "" : " empty"}`}
                  key={position}
                  aria-hidden={banner ? undefined : true}
                >
                  {content}
                </div>
              );
            })}
          </section>
          {renderBenefitsStrip("benefits-strip banner-benefits")}
        </>
      ) : (
        <section
          className="hero"
          aria-labelledby="hero-title"
          aria-roledescription="carousel"
          aria-label="বিশেষ পণ্যের সংগ্রহ"
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
          onFocusCapture={() => setHeroPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setHeroPaused(false);
          }}
        >
          <img
            className="hero-background-image"
            decoding="async"
            key={heroSlide.id || heroSlide.image}
            src={
              heroSlide.image.startsWith("/")
                ? heroSlide.image
                : imageUrl(heroSlide.image, 2000)
            }
            alt={heroSlide.imageAlt}
            fetchPriority="high"
          />
          <div className="hero-copy" aria-live="polite" aria-atomic="true">
            <span className="hero-kicker">
              <span /> {heroSlide.kicker}
            </span>
            <h1 id="hero-title">
              {heroSlide.headline}
              <br />
              <em>{heroSlide.emphasis}</em>
            </h1>
            <p>{heroSlide.description}</p>
            <div className="hero-actions">
              <Link
                className="button dark"
                to={`/shop?category=${encodeURIComponent(heroSlide.category)}`}
              >
                {heroSlide.buttonText} <ArrowRight size={17} />
              </Link>
              <Link className="hero-secondary-link" to="/shop?sort=newest">
                নতুন পণ্য দেখুন
              </Link>
            </div>
            <div className="hero-assurance">
              <ShieldCheck size={16} />
              <span>অফিশিয়াল ওয়ারেন্টি</span>
              <i />
              <Truck size={16} />
              <span>যত্নসহকারে ডেলিভারি</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-product-label">
              <span>{heroSlide.productLabel}</span>
              <strong>{heroSlide.productName}</strong>
              <small>{heroSlide.productDescription}</small>
            </div>
            <div className="hero-floating">
              <span className="hero-floating-dot" />
              <span>প্রতিদিনের ব্যবহারের জন্য বাছাইকৃত</span>
            </div>
            <span className="hero-visual-caption">
              প্রয়োজনীয় মানসম্মত পণ্যের সংগ্রহ
            </span>
            <div
              className="hero-slider-controls"
              aria-label="বিশেষ পণ্যের স্লাইড"
            >
              <button
                type="button"
                className="hero-slider-arrow"
                aria-label="আগের বিশেষ পণ্য"
                onClick={() => moveHeroSlide(-1)}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="hero-slider-dots">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id || slide.productName}
                    type="button"
                    aria-label={`স্লাইড ${index + 1} দেখুন: ${slide.productName}`}
                    aria-pressed={activeSlideIndex === index}
                    className={activeSlideIndex === index ? "active" : ""}
                    onClick={() => setActiveHeroSlide(index)}
                  />
                ))}
              </div>
              <span className="hero-slider-count">
                0{activeSlideIndex + 1}
                <i />0{slides.length}
              </span>
              <button
                type="button"
                className="hero-slider-arrow"
                aria-label="পরের বিশেষ পণ্য"
                onClick={() => moveHeroSlide(1)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
      {!hasManagedBanners && renderBenefitsStrip()}
      <BangladeshShoppingInfo siteContent={siteContent} />
      <section className="section category-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">আপনার পছন্দের পণ্য খুঁজুন</span>
            <h2>ক্যাটাগরি অনুযায়ী কিনুন</h2>
          </div>
          <Link className="text-link" to="/shop">
            সব ক্যাটাগরি দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categoryItems.map(({ name, slug, image, description }, index) => {
            const Icon = /phone|mobile|smartphone/i.test(name)
              ? Smartphone
              : /mouse/i.test(name)
                ? Mouse
                : /light|lamp|bulb/i.test(name)
                  ? Lightbulb
                  : /e-?books?/i.test(name)
                    ? BookOpen
                    : /computer|laptop|tablet|pc/i.test(name)
                      ? Laptop
                      : /audio|headphone|sound|speaker/i.test(name)
                        ? Headphones
                        : /watch|wearable/i.test(name)
                          ? Watch
                          : /camera|photo/i.test(name)
                            ? Camera
                            : [Smartphone, Laptop, Headphones][index % 3];
            const presentation = categoryPresentation(name, image);
            const tones = ["cat-lilac", "cat-blue", "cat-peach"];
            return (
              <Link
                className={`category-card ${tones[index % tones.length]}`}
                key={slug}
                to={`/shop?category=${encodeURIComponent(slug)}`}
                aria-label={`Shop ${name}`}
              >
                <img
                  className="category-card-image"
                  src={imageUrl(presentation.image, 900)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
                <span className="category-card-shade" aria-hidden="true" />
                <div className="category-card-copy">
                  <span>{description || presentation.caption}</span>
                  <strong>{name}</strong>
                </div>
                <span className="category-card-icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={1.5} />
                </span>
                <ArrowRight className="category-arrow" size={17} />
              </Link>
            );
          })}
        </div>
      </section>
      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">নতুন সংগ্রহ</span>
            <h2>{siteContent.newArrivalsTitle || "নতুন এসেছে"}</h2>
            <p>{siteContent.newArrivalsDescription || "সদ্য যুক্ত হওয়া পণ্যগুলো এক নজরে দেখুন"}</p>
          </div>
          <Link className="text-link" to="/shop?sort=newest">
            নতুন পণ্য দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        <ProductGrid items={latestProducts} onAdd={onAdd} onCompare={onCompare} comparedIds={comparedIds} />
      </section>
      <section className="section featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">বিশেষভাবে বাছাই করা</span>
            <h2>{siteContent.featuredTitle || "বাছাই করা পণ্য"}</h2>
            <p>{siteContent.featuredDescription || "আপনার জন্য আমাদের পছন্দের প্রযুক্তি পণ্য"}</p>
          </div>
          <Link className="text-link" to="/shop">
            সব পণ্য দেখুন <ArrowRight size={16} />
          </Link>
        </div>
        <ProductGrid items={displayedProducts} onAdd={onAdd} onCompare={onCompare} comparedIds={comparedIds} />
      </section>
      <section className="editorial">
        <div className="editorial-image">
          <img
            src={imageUrl("photo-1498049794561-7780e7231661", 1000)}
            alt="A curated collection of everyday technology"
            loading="lazy"
          />
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">আপনার জীবনের উপযোগী প্রযুক্তি</span>
          <h2>
            প্রযুক্তি হোক
            <br />প্রতিদিনের সঙ্গী।
          </h2>
          <p>
            কাজ, পড়াশোনা ও বিনোদনের জন্য বেছে নিন দৈনন্দিন জীবনে কাজে লাগে এমন প্রযুক্তি পণ্য।
          </p>
          <Link className="button light" to="/shop">
            পণ্য দেখুন <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="newsletter">
        <div>
          <span className="eyebrow">কিছু ভালো খবর</span>
          <h2>নতুন অফার সবার আগে জানুন।</h2>
          <p>
            নতুন পণ্য, দরকারি আপডেট ও বিশেষ অফারের খবর সরাসরি ইমেইলে পান।
          </p>
        </div>
        <NewsletterForm />
      </section>
    </>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data?.subscribed) {
        throw new Error(result.message || "সাবস্ক্রিপশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
      }
      setSubscribed(true);
      setStatus("success");
      setMessage(result.message || "আপনি তালিকায় যুক্ত হয়েছেন। ধন্যবাদ!");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "সার্ভারের সঙ্গে সংযোগ করা যায়নি। পরে আবার চেষ্টা করুন।");
    }
  }

  return subscribed ? (
    <div className="subscribe-success" role="status" aria-live="polite">
      <Check size={18} /> {message}
    </div>
  ) : (
    <form className="newsletter-form" onSubmit={submit}>
      <label className="sr-only" htmlFor="newsletter-email">
        ইমেইল ঠিকানা
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="আপনার ইমেইল ঠিকানা"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        maxLength={254}
        disabled={status === "loading"}
        aria-describedby={status === "error" ? "newsletter-error" : undefined}
      />
      <button type="submit" aria-label="সাবস্ক্রাইব করুন" disabled={status === "loading"}>
        {status === "loading" ? <span className="newsletter-spinner" aria-hidden="true" /> : <ArrowRight size={19} />}
      </button>
      {status === "error" ? <small id="newsletter-error" role="alert">{message}</small> : null}
      <small>নতুন পণ্য ও বিশেষ অফারের আপডেট পেতে সাবস্ক্রাইব করুন।</small>
    </form>
  );
}

function ShopPage({
  onAdd,
  onCompare,
  comparedIds,
  products,
  categories,
  catalogLive,
  catalogLoading,
  onCatalogProducts,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || "সব পণ্য";
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "featured";
  const parsedPage = Number(searchParams.get("page"));
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [shopProducts, setShopProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const productsRef = useRef(products);
  productsRef.current = products;
  const shopCategories = categories.length
    ? categories
    : categoriesFromProducts(products);
  const selectedCategory = shopCategories.find(
    (item) =>
      item.slug === categoryParam ||
      item.name.toLowerCase() === categoryParam.toLowerCase(),
  );
  const categorySlug =
    categoryParam === "সব পণ্য"
      ? ""
      : selectedCategory?.slug || slugify(categoryParam);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setCatalogError("");
    setShopProducts([]);
    setPagination({ page: 1, pages: 1, total: 0 });
    fetchCatalogPage({
      apiUrl: API_URL,
      page: currentPage,
      limit: CATALOG_PAGE_SIZE,
      category: categorySlug,
      query,
      sort,
      signal: controller.signal,
    })
      .then(({ items, pagination: nextPagination }) => {
        if (
          searchParams.has("page") &&
          searchParams.get("page") !== String(currentPage)
        ) {
          const next = new URLSearchParams(searchParams);
          next.delete("page");
          setSearchParams(next, { replace: true });
          return;
        }
        const lastPage = Math.max(1, nextPagination.pages);
        if (currentPage > lastPage) {
          const next = new URLSearchParams(searchParams);
          if (lastPage === 1) next.delete("page");
          else next.set("page", String(lastPage));
          setSearchParams(next, { replace: true });
          return;
        }
        setShopProducts(items);
        setPagination(nextPagination);
        onCatalogProducts(items);
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        if (!catalogLive) {
          const previewProducts = filterCatalogProducts(productsRef.current, {
            category: categorySlug,
            query,
            sort,
          });
          setShopProducts(previewProducts);
          setPagination({ page: 1, pages: 1, total: previewProducts.length });
          if (
            currentPage !== 1 ||
            (searchParams.has("page") && searchParams.get("page") !== "1")
          ) {
            const next = new URLSearchParams(searchParams);
            next.delete("page");
            setSearchParams(next, { replace: true });
          }
        } else {
          setCatalogError(error.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    catalogLive,
    categorySlug,
    currentPage,
    onCatalogProducts,
    query,
    searchParams,
    setSearchParams,
    sort,
  ]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (
      !value ||
      value === "সব পণ্য" ||
      value === "featured" ||
      (key === "page" && value === "1")
    )
      next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  }

  const pageWindowStart = Math.min(
    Math.max(1, pagination.page - 2),
    Math.max(1, pagination.pages - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(pagination.pages, 5) },
    (_, index) => pageWindowStart + index,
  );

  return (
    <section className="shop-page section">
      <CatalogNotice live={catalogLive} loading={catalogLoading} />
      <div className="breadcrumbs">
        <Link to="/">হোম</Link>
        <ChevronRight size={14} />
        <span>দোকান</span>
      </div>
      <div className="shop-heading">
        <div>
          <span className="eyebrow">ইলেক্ট্রোস্টোরের বাছাই</span>
          <h1>আপনার পরের পছন্দটি খুঁজুন।</h1>
          <p>যত্নসহকারে বাছাই করা মানসম্মত প্রযুক্তি।</p>
        </div>
        <span className="shop-count">{pagination.total} products</span>
      </div>
      <div className="shop-controls">
        <div className="filter-pills">
          <button
            className={
              categoryParam === "সব পণ্য"
                ? "filter-pill selected"
                : "filter-pill"
            }
            onClick={() => updateParam("category", "সব পণ্য")}
          >
            সব পণ্য
          </button>
          {shopCategories.map((item) => (
            <button
              key={item.slug}
              className={
                selectedCategory?.slug === item.slug
                  ? "filter-pill selected"
                  : "filter-pill"
              }
              onClick={() => updateParam("category", item.slug)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className="sort-control">
          Sort by
          <select
            value={sort}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            <option value="featured">বিশেষ পণ্য</option>
            <option value="newest">নতুন পণ্য</option>
            <option value="price-low">দাম: কম থেকে বেশি</option>
            <option value="price-high">দাম: বেশি থেকে কম</option>
            <option value="rating">সর্বোচ্চ রেটিং</option>
          </select>
          <ChevronDown size={15} />
        </label>
      </div>
      {query && (
        <p className="search-result-label">
          Showing results for <strong>“{query}”</strong>{" "}
          <button onClick={() => updateParam("q", "")}>সার্চ মুছুন</button>
        </p>
      )}
      {catalogError && (
        <div className="catalog-error" role="alert">
          {catalogError}
        </div>
      )}
      {loading && (
        <div className="catalog-loading" role="status">
          পণ্য লোড হচ্ছে...
        </div>
      )}
      {!loading && (shopProducts.length > 0 || !catalogError) && (
        <ProductGrid items={shopProducts} onAdd={onAdd} onCompare={onCompare} comparedIds={comparedIds} />
      )}
      {pagination.pages > 1 && (
        <nav className="catalog-pagination" aria-label="পণ্যের পৃষ্ঠা">
          <button
            className="page-button page-direction"
            onClick={() => updateParam("page", String(pagination.page - 1))}
            disabled={loading || pagination.page <= 1}
            aria-label="আগের পৃষ্ঠা"
          >
            আগের
          </button>
          <div className="page-numbers">
            {visiblePages.map((page) => (
              <button
                className={`page-button${page === pagination.page ? " current" : ""}`}
                key={page}
                onClick={() => updateParam("page", String(page))}
                disabled={loading || page === pagination.page}
                aria-label={`Page ${page}`}
                aria-current={page === pagination.page ? "page" : undefined}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            className="page-button page-direction"
            onClick={() => updateParam("page", String(pagination.page + 1))}
            disabled={loading || pagination.page >= pagination.pages}
            aria-label="পরের পৃষ্ঠা"
          >
            পরের
          </button>
          <span className="page-summary">
            Page {pagination.page} of {pagination.pages} · {pagination.total}{" "}
            products
          </span>
        </nav>
      )}
    </section>
  );
}

function ProductPage({ onAdd, products }) {
  const { id } = useParams();
  const product = products.find((item) => item.id === id);
  if (!product)
    return (
      <main className="not-found section">
        <span className="eyebrow">একটু অন্য পথে</span>
        <h1>পণ্যটি খুঁজে পাওয়া যায়নি।</h1>
        <Link className="button dark" to="/shop">
          দোকানে ফিরে যান
        </Link>
      </main>
    );
  const related = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4);
  const outOfStock = product.stock !== undefined && product.stock < 1;
  return (
    <>
      <section className="product-page section">
        <div className="breadcrumbs">
          <Link to="/">হোম</Link>
          <ChevronRight size={14} />
          <Link to="/shop">দোকান</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </div>
        <div className="product-detail">
          <ProductImage
            product={product}
            className={`detail-image ${product.color}`}
          />
          <div className="detail-copy">
            <span className="eyebrow">
              {product.brand} · {product.category}
            </span>
            <h1>{product.name}</h1>
            <div className="detail-rating">
              <span>★ {product.rating}</span>{" "}
              <span>({product.reviews} thoughtful reviews)</span>
            </div>
            <div className="detail-price">
              <strong>{formatPrice(product.price)}</strong>
              {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
              {product.oldPrice && (
                <span className="save-pill">
                  Save {formatPrice(product.oldPrice - product.price)}
                </span>
              )}
            </div>
            <p className="detail-description">{product.description}</p>
            <div className={`availability${outOfStock ? " unavailable" : ""}`}>
              <span />{" "}
              {outOfStock
                ? "এই মুহূর্তে পাওয়া যাচ্ছে না"
                : product.stock === undefined
                  ? "আবিষ্কার শুরু করুন"
                  : `${product.stock} in stock and ready to ship`}
            </div>
            <button
              className="button dark add-to-cart"
              disabled={outOfStock}
              onClick={() => onAdd(product.id)}
            >
              <ShoppingBag size={17} />{" "}
              {outOfStock ? "স্টক শেষ" : "কার্টে যোগ করুন"}{" "}
              <span>{formatPrice(product.price)}</span>
            </button>
            <div className="detail-promises">
              <div>
                <Truck size={17} />
                <span>৳৫,০০০-এর বেশি অর্ডারে বিনামূল্যে ডেলিভারি</span>
              </div>
              <div>
                <ShieldCheck size={17} />
                <span>অফিশিয়াল ওয়ারেন্টি রয়েছে</span>
              </div>
              <div>
                <PackageCheck size={17} />
                <span>১৪ দিনের মধ্যে ফেরতের সুবিধা</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section related-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">আরও দেখুন</span>
              <h2>আপনার পছন্দ হতে পারে</h2>
            </div>
            <Link className="text-link" to="/shop">
              সব পণ্য দেখুন <ArrowRight size={16} />
            </Link>
          </div>
          <ProductGrid items={related} onAdd={onAdd} />
        </section>
      )}
    </>
  );
}

function CartPage({ cart, products, onQuantity, onRemove }) {
  const items = cart.map((entry) => ({
    ...entry,
    product:
      products.find((product) => product.id === entry.productId) ||
      entry.snapshot,
  }));
  const subtotal = items.reduce(
    (total, item) =>
      total + (item.product ? item.product.price * item.quantity : 0),
    0,
  );
  const unavailableItems = items.some(
    (item) =>
      !item.product ||
      (item.product.stock !== undefined && item.quantity > item.product.stock),
  );
  if (!items.length)
    return (
      <section className="empty-cart section">
        <div className="empty-bag">
          <ShoppingBag size={29} />
        </div>
        <span className="eyebrow">নতুন কিছু বেছে নিন</span>
        <h1>আপনার কার্ট এখন খালি।</h1>
        <p>
          সংগ্রহ দেখুন এবং প্রতিদিন কাজে লাগবে এমন পণ্য বেছে নিন।
        </p>
        <Link className="button dark" to="/shop">
          Explore the shop <ArrowRight size={17} />
        </Link>
      </section>
    );
  return (
    <section className="cart-page section">
      <div className="breadcrumbs">
        <Link to="/">হোম</Link>
        <ChevronRight size={14} />
        <span>আপনার কার্ট</span>
      </div>
      <div className="cart-heading">
        <div>
          <span className="eyebrow">আপনার পছন্দের পণ্য</span>
          <h1>
            আপনার কার্ট <span>({items.length})</span>
          </h1>
        </div>
        <Link className="text-link" to="/shop">
          <ArrowLeft size={15} /> কেনাকাটা চালিয়ে যান
        </Link>
      </div>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(({ product, quantity, productId }) =>
            product ? (
              <article className="cart-item" key={productId}>
                <Link
                  className={`cart-image ${product.color}`}
                  to={`/product/${product.id}`}
                >
                  <img src={imageUrl(product.image, 360)} alt={product.name} loading="lazy" decoding="async" />
                </Link>
                <div className="cart-product">
                  <span>
                    {product.brand} · {product.category}
                  </span>
                  <Link to={`/product/${product.id}`}>{product.name}</Link>
                  <small>
                    {product.stock === undefined || product.stock > 0
                      ? "স্টকে আছে"
                      : "এই মুহূর্তে পাওয়া যাচ্ছে না"}
                  </small>
                  <div className="quantity-control">
                    <button
                      aria-label={`Decrease ${product.name} quantity`}
                      onClick={() => onQuantity(productId, quantity - 1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      aria-label={`Increase ${product.name} quantity`}
                      disabled={
                        product.stock !== undefined && quantity >= product.stock
                      }
                      onClick={() => onQuantity(productId, quantity + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-line-price">
                  <strong>{formatPrice(product.price * quantity)}</strong>
                  <button onClick={() => onRemove(productId)}>সরান</button>
                </div>
              </article>
            ) : (
              <article className="cart-item unavailable-item" key={productId}>
                <div className="image-fallback">
                  <PackageCheck size={24} />
                </div>
                <div className="cart-product">
                  <span>ক্যাটালগ আপডেট</span>
                  <strong>পণ্যের বিস্তারিত পাওয়া যাচ্ছে না</strong>
                  <small>এই পণ্যটি সরিয়ে দোকানটি রিফ্রেশ করুন।</small>
                </div>
                <div className="cart-line-price">
                  <button onClick={() => onRemove(productId)}>সরান</button>
                </div>
              </article>
            ),
          )}
          <div className="delivery-note">
            <Truck size={17} />{" "}
            {subtotal >= 5000
              ? "আপনার অর্ডারে বিনামূল্যে ডেলিভারি প্রযোজ্য।"
              : `Add ${formatPrice(5000 - subtotal)} more to unlock free delivery.`}
          </div>
        </div>
        <aside className="order-summary">
          <h2>অর্ডারের সারাংশ</h2>
          <div>
            <span>উপমোট</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div>
            <span>ডেলিভারি</span>
            <strong>{subtotal >= 5000 ? "Free" : formatPrice(150)}</strong>
          </div>
          <p>প্রদর্শিত দামের মধ্যে কর অন্তর্ভুক্ত।</p>
          <div className="summary-total">
            <span>আনুমানিক মোট</span>
            <strong>
              {formatPrice(subtotal + (subtotal >= 5000 ? 0 : 150))}
            </strong>
          </div>
          {unavailableItems ? (
            <span className="button dark checkout-button disabled-button">
              চালিয়ে যেতে কার্ট আপডেট করুন
            </span>
          ) : (
            <Link className="button dark checkout-button" to="/checkout">
              Continue to checkout <ArrowRight size={17} />
            </Link>
          )}
          <div className="secure-note">
            <ShieldCheck size={15} /> নিরাপদ চেকআউট
          </div>
        </aside>
      </div>
    </section>
  );
}

function CheckoutPage({
  cart,
  products,
  user,
  accessToken,
  onTokenRefresh,
  catalogLive,
  siteContent = {},
}) {
  const text = (key, fallback) => siteContent[key] || fallback;
  const items = cart
    .map((entry) => ({
      ...entry,
      product:
        products.find((product) => product.id === entry.productId) ||
        entry.snapshot,
    }))
    .filter((entry) => entry.product);
  const hasUnavailableItems =
    items.length !== cart.length ||
    items.some(
      (item) =>
        item.product.stock !== undefined && item.quantity > item.product.stock,
    );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  if (!items.length)
    return (
      <section className="empty-cart section">
        <div className="empty-bag">
          <ShoppingBag size={29} />
        </div>
        <span className="eyebrow">চেকআউট করার কিছু নেই</span>
        <h1>আপনার কার্ট খালি।</h1>
        <Link className="button dark" to="/shop">
          Explore the shop <ArrowRight size={17} />
        </Link>
      </section>
    );
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!accessToken) {
      setError("নিরাপদ চেকআউট চালিয়ে যেতে আগে লগইন করুন।");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const { response, accessToken: nextToken } = await fetchWithAuth(
        "/payments/sslcommerz/sessions",
        accessToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
            couponCode: form.get("couponCode"),
            shippingAddress: {
              name: form.get("name"),
              phone: form.get("phone"),
              city: form.get("city"),
              addressLine1: form.get("address"),
              postalCode: form.get("postalCode") || "1000",
            },
          }),
        },
      );
      if (nextToken && nextToken !== accessToken) onTokenRefresh(nextToken);
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "চেকআউট শুরু করা যায়নি।");
      window.location.assign(result.data.paymentUrl);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "নিরাপদ চেকআউটে সংযোগ করা যায়নি। আবার চেষ্টা করুন।"
          : requestError.message,
      );
      setBusy(false);
    }
  }
  return (
    <section className="checkout-page section">
      <div className="breadcrumbs">
        <Link to="/">হোম</Link>
        <ChevronRight size={14} />
        <Link to="/cart">আপনার কার্ট</Link>
        <ChevronRight size={14} />
        <span>চেকআউট</span>
      </div>
      <div className="shop-heading">
        <div>
          <span className="eyebrow">{text("checkoutEyebrow", "আর মাত্র এক ধাপ")}</span>
          <h1>{text("checkoutTitle", "নিরাপদ চেকআউট")}</h1>
          <p>{text("checkoutDescription", "SSLCommerz-এর নিরাপদ পেমেন্ট পেজে পেমেন্ট সম্পন্ন হবে।")}</p>
        </div>
        <span className="secure-note">
          <ShieldCheck size={15} /> SSLCommerz চেকআউট
        </span>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>{text("checkoutDeliveryHeading", "ডেলিভারির তথ্য")}</h2>
          <div className="checkout-fields">
            <label>
              {text("checkoutNameLabel", "পূর্ণ নাম")}
              <input
                name="name"
                autoComplete="name"
                defaultValue={user?.name || ""}
                required
                placeholder={text("checkoutNamePlaceholder", "আপনার নাম লিখুন")}
              />
            </label>
            <label>
              {text("checkoutPhoneLabel", "মোবাইল নম্বর")}
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                pattern="(?:\+?88)?01[3-9]\d{8}"
                title={text("checkoutPhoneTitle", "বাংলাদেশি মোবাইল নম্বর লিখুন, যেমন 01XXXXXXXXX")}
                required
                placeholder="01XXXXXXXXX"
              />
            </label>
            <label>
              {text("checkoutCityLabel", "শহর / জেলা")}
              <input
                name="city"
                autoComplete="address-level2"
                required
                placeholder={text("checkoutCityPlaceholder", "যেমন: ঢাকা")}
              />
            </label>
            <label>
              {text("checkoutPostalLabel", "পোস্ট কোড (ঐচ্ছিক)")}
              <input
                name="postalCode"
                autoComplete="postal-code"
                placeholder="1000"
              />
            </label>
            <label className="full-field">
              {text("checkoutAddressLabel", "সম্পূর্ণ ডেলিভারি ঠিকানা")}
              <input
                name="address"
                autoComplete="street-address"
                required
                placeholder={text("checkoutAddressPlaceholder", "বাড়ি, রোড, এলাকা, থানা")}
              />
            </label>
            <label className="full-field">
              {text("checkoutCouponLabel", "ডিসকাউন্ট কোড (ঐচ্ছিক)")}
              <input
                name="couponCode"
                autoComplete="off"
                maxLength="64"
                placeholder={text("checkoutCouponPlaceholder", "কুপন কোড লিখুন")}
              />
            </label>
          </div>
          {!user && (
            <p className="form-error">
              Sign in to your account before making a payment.{" "}
              <Link to="/login?next=%2Fcheckout">লগইন</Link>
            </p>
          )}
          {!catalogLive && (
            <p className="form-error">
              The live product catalog is unavailable. Secure checkout is
              temporarily disabled.
            </p>
          )}
          {hasUnavailableItems && (
            <p className="form-error">
              Some items are no longer available. Return to your cart and remove
              them before checkout.
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button dark checkout-button"
            type="submit"
            disabled={
              busy || !accessToken || !catalogLive || hasUnavailableItems
            }
          >
            {busy
              ? "পেমেন্ট গেটওয়েতে সংযোগ হচ্ছে…"
              : text("checkoutPayButton", "নিরাপদ পেমেন্টে এগিয়ে যান")}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <aside className="order-summary">
          <h2>{text("checkoutOrderTitle", "আপনার অর্ডার")}</h2>
          {items.map((item) => (
            <div className="checkout-line" key={item.productId}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <strong>{formatPrice(item.product.price * item.quantity)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>{text("checkoutSubtotalLabel", "আনুমানিক উপমোট")}</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="checkout-disclaimer">
            {text("checkoutDisclaimer", "পেমেন্টের আগে ডিসকাউন্ট কোড, চূড়ান্ত মূল্য, ডেলিভারি ও স্টক যাচাই করা হবে।")}
          </p>
        </aside>
      </div>
    </section>
  );
}

function PaymentResultPage({ accessToken, authReady, onPaid, onTokenRefresh }) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    payment: null,
    error: "",
  });
  const transactionId = searchParams.get("tran_id");
  const callbackStatus = searchParams.get("status");

  useEffect(() => {
    if (!authReady) return undefined;
    if (!transactionId) {
      setState({
        loading: false,
        payment: null,
        error: "We could not find a payment reference.",
      });
      return undefined;
    }
    if (callbackStatus === "cancelled" || callbackStatus === "failed") {
      setState({
        loading: false,
        payment: null,
        error:
          callbackStatus === "cancelled"
            ? "Payment was cancelled. Your order will expire automatically."
            : "Payment could not be completed. Please try again.",
      });
      return undefined;
    }
    if (!accessToken) {
      setState({
        loading: false,
        payment: null,
        error:
          "Sign in with the account used for checkout to view this payment.",
      });
      return undefined;
    }

    let active = true;
    let attempts = 0;
    let timeout;
    async function checkStatus() {
      try {
        const { response, accessToken: nextToken } = await fetchWithAuth(
          `/payments/sslcommerz/${encodeURIComponent(transactionId)}/status`,
          accessToken,
        );
        if (nextToken && nextToken !== accessToken) onTokenRefresh(nextToken);
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Unable to verify payment status.");
        const payment = result.data.payment;
        if (!active) return;
        if (payment.status === "paid") {
          onPaid();
          setState({ loading: false, payment, error: "" });
        } else if (
          ["pending", "verifying"].includes(payment.status) &&
          attempts < 8
        ) {
          attempts += 1;
          timeout = window.setTimeout(checkStatus, 2500);
          setState({ loading: true, payment, error: "" });
        } else {
          setState({ loading: false, payment, error: "" });
        }
      } catch (requestError) {
        if (active)
          setState({
            loading: false,
            payment: null,
            error: requestError.message,
          });
      }
    }
    checkStatus();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [
    accessToken,
    authReady,
    callbackStatus,
    onPaid,
    onTokenRefresh,
    transactionId,
  ]);

  return (
    <section className="confirmation section">
      <div className="confirmation-icon">
        {state.loading ? (
          <ShieldCheck size={26} />
        ) : state.payment?.status === "paid" ? (
          <Check size={28} />
        ) : (
          <X size={25} />
        )}
      </div>
      <span className="eyebrow">
        {state.loading
          ? "VERIFYING YOUR PAYMENT"
          : state.payment?.status === "paid"
            ? "PAYMENT CONFIRMED"
            : "PAYMENT STATUS"}
      </span>
      <h1>
        {state.loading
          ? "Just a moment."
          : state.payment?.status === "paid"
            ? "Thank you for your order."
            : ["pending", "verifying"].includes(state.payment?.status)
              ? "Payment is still processing."
              : "পেমেন্ট নিশ্চিত করা যায়নি।"}
      </h1>
      {state.payment?.order && (
        <p>
          Order <strong>{state.payment.order.orderNumber}</strong> ·{" "}
          {formatPrice(state.payment.amount)} · {state.payment.status}
        </p>
      )}
      {state.payment?.order?.orderStatus === "on-hold" && (
        <p role="alert">
          Payment was received, but stock needs a manual review before
          fulfillment. Please contact store support with your order number.
        </p>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      <div className="confirmation-actions">
        <Link className="button dark" to="/shop">
          Continue shopping <ArrowRight size={17} />
        </Link>
        {["pending", "verifying"].includes(state.payment?.status) && (
          <Link className="text-link" to="/cart">
            কার্টে ফিরে যান
          </Link>
        )}
      </div>
    </section>
  );
}

const orderProgress = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function MyOrdersPage({ user, accessToken, authReady, onTokenRefresh }) {
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!authReady) return undefined;
    if (!user) {
      setLoading(false);
      setOrders([]);
      setOrderPage(1);
      setOrderPagination({ page: 1, pages: 1, total: 0 });
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError("");
    fetchWithAuth(`/orders?page=${orderPage}&limit=10`, accessToken)
      .then(async ({ response, accessToken: nextToken, session }) => {
        if (nextToken && nextToken !== accessToken) onTokenRefresh(nextToken);
        if (session?.user) onTokenRefresh(nextToken);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load your orders.");
        }
        if (active) {
          setOrders(result.data.items || []);
          setOrderPagination(
            result.data.pagination || {
              page: orderPage,
              pages: 1,
              total: (result.data.items || []).length,
            },
          );
        }
      })
      .catch((requestError) => {
        if (active)
          setError(requestError.message || "Could not load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, authReady, onTokenRefresh, orderPage, reloadKey, user]);

  if (!authReady || loading) {
    return (
      <section className="orders-page section">
        <p role="status">আপনার অর্ডার লোড হচ্ছে...</p>
      </section>
    );
  }
  if (!user) {
    return (
      <section className="orders-page section">
        <div className="orders-empty">
          <PackageCheck size={30} />
          <h1>অর্ডার ট্র্যাক করতে লগইন করুন</h1>
          <p>
            Your order history and delivery updates are linked to your customer
            account.
          </p>
          <Link className="button dark" to="/login?next=%2Forders">
            লগইন
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page section">
      <div className="orders-heading">
        <div>
          <span className="eyebrow">আপনার অ্যাকাউন্ট</span>
          <h1>অর্ডার ট্র্যাকিং</h1>
          <p>আপনার কেনাকাটার পেমেন্ট ও ডেলিভারির আপডেট দেখুন।</p>
        </div>
        <button
          className="button outline"
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          অর্ডার রিফ্রেশ করুন
        </button>
      </div>
      {error && (
        <div className="orders-error" role="alert">
          {error}
          <button
            className="text-link"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}
      {!error && orders.length === 0 && (
        <div className="orders-empty">
          <PackageCheck size={30} />
          <h2>এখনও কোনো অর্ডার নেই</h2>
          <p>অর্ডার করলে এখানে অগ্রগতি দেখতে পারবেন।</p>
          <Link className="button dark" to="/shop">
            পণ্য দেখুন
          </Link>
        </div>
      )}
      <div className="orders-list">
        {orders.map((order) => {
          const statusIndex = orderProgress.indexOf(order.orderStatus);
          const cancelled =
            order.orderStatus === "cancelled" ||
            order.orderStatus === "on-hold";
          const tracking = order.tracking || {};
          return (
            <article className="customer-order-card" key={order._id}>
              <header className="customer-order-header">
                <div>
                  <span className="eyebrow">অর্ডার</span>
                  <h2>{order.orderNumber}</h2>
                  <small>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : ""}
                  </small>
                </div>
                <div className="customer-order-total">
                  <span>
                    {order.paymentStatus} ·{" "}
                    {order.orderStatus.replace("-", " ")}
                  </span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </header>
              {cancelled ? (
                <p className="order-cancelled" role="status">
                  {order.orderStatus === "on-hold"
                    ? "This order is on hold. Please contact store support for an update."
                    : "This order was cancelled."}
                </p>
              ) : (
                <ol
                  className="order-progress"
                  aria-label={`Order status: ${order.orderStatus}`}
                >
                  {orderProgress.map((status, index) => (
                    <li
                      className={index <= statusIndex ? "complete" : ""}
                      key={status}
                    >
                      <span>
                        {index < statusIndex ? (
                          <Check size={14} />
                        ) : index === statusIndex ? (
                          <Truck size={14} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <small>{status}</small>
                    </li>
                  ))}
                </ol>
              )}
              {tracking.notes && (
                <p className="order-customer-note">{tracking.notes}</p>
              )}
              {tracking.trackingNumber && (
                <div className="order-tracking-details">
                  <div>
                    <span>ডেলিভারি ট্র্যাকিং</span>
                    <strong>
                      {tracking.carrier ? `${tracking.carrier} · ` : ""}
                      {tracking.trackingNumber}
                    </strong>
                  </div>
                  {tracking.trackingUrl && (
                    <a
                      className="text-link"
                      href={tracking.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Track package <ArrowRight size={15} />
                    </a>
                  )}
                </div>
              )}
              <div className="customer-order-items">
                {(order.items || []).map((item, index) => (
                  <div key={`${item.sku || item.productName}-${index}`}>
                    <span>
                      {item.productName || "Product"} × {item.quantity}
                    </span>
                    <strong>{formatPrice(item.totalPrice)}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      {orderPagination.pages > 1 && (
        <nav className="catalog-pagination" aria-label="Order history pages">
          <button
            className="page-button page-direction"
            type="button"
            disabled={orderPage <= 1 || loading}
            onClick={() => setOrderPage((page) => page - 1)}
          >
            <ArrowLeft size={15} /> আগের
          </button>
          <span className="shop-count" aria-live="polite">
            Page {orderPagination.page} of {orderPagination.pages}
          </span>
          <button
            className="page-button page-direction"
            type="button"
            disabled={orderPage >= orderPagination.pages || loading}
            onClick={() => setOrderPage((page) => page + 1)}
          >
            পরের <ArrowRight size={15} />
          </button>
        </nav>
      )}
    </section>
  );
}

function AuthPage({ onLogin, user }) {
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleButtonRef = useRef(null);
  const onLoginRef = useRef(onLogin);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  onLoginRef.current = onLogin;
  const next = searchParams.get("next");
  const destination = next === "/checkout" || next === "/orders" ? next : "/";

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;
    let active = true;

    function renderGoogleButton() {
      const googleIdentity = window.google?.accounts?.id;
      if (!active || !googleIdentity || !googleButtonRef.current) return;
      googleIdentity.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setGoogleError("");
          setBusy(true);
          try {
            const response = await fetch(`${API_URL}/auth/google`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
              throw new Error(
                result.message || "Google sign-in could not be completed.",
              );
            }
            onLoginRef.current(result.data);
            navigate(destination);
          } catch (requestError) {
            setGoogleError(
              requestError instanceof TypeError
                ? "Could not connect to the account service. Please try again."
                : requestError.message,
            );
          } finally {
            setBusy(false);
          }
        },
      });
      googleIdentity.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: Math.min(350, googleButtonRef.current.parentElement.clientWidth),
        logo_alignment: "left",
      });
    }

    let script = document.querySelector("script[data-google-identity]");
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (script) {
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", handleScriptError);
    } else {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.addEventListener("load", renderGoogleButton);
      script.addEventListener("error", handleScriptError);
      document.head.appendChild(script);
    }

    function handleScriptError() {
      if (active)
        setGoogleError(
          "Google sign-in could not be loaded. Check your connection and try again.",
        );
    }

    return () => {
      active = false;
      script?.removeEventListener("load", renderGoogleButton);
      script?.removeEventListener("error", handleScriptError);
      if (googleButtonRef.current) googleButtonRef.current.replaceChildren();
    };
  }, [destination, navigate]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      email: form.get("email"),
      password: form.get("password"),
    };
    if (registering) payload.name = form.get("name");
    try {
      const response = await fetch(
        `${API_URL}/auth/${registering ? "register" : "login"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(
          result.message || "We could not complete your request.",
        );
      onLogin(result.data);
      navigate(destination);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Could not connect to the store account service. Please try again shortly."
          : requestError.message,
      );
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <section className="account-page section">
        <div className="account-card">
          <div className="confirmation-icon">
            <Check size={26} />
          </div>
          <span className="eyebrow">আপনার অ্যাকাউন্ট</span>
          <h1>Welcome, {user.name}.</h1>
          <p>Signed in as {user.email}</p>
          <Link className="button dark" to="/shop">
            Continue shopping <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    );
  return (
    <section className="account-page section">
      <div className="account-card">
        <Link to="/" className="account-logo">
          <img src="/electrostore-mark.svg" alt="ElectroStore logo" />
        </Link>
        <span className="eyebrow">
          {destination === "/checkout"
            ? "YOUR PURCHASE, SECURED"
            : registering
              ? "A GOOD PLACE TO START"
              : "GOOD TO HAVE YOU BACK"}
        </span>
        <h1>
          {registering
            ? "Create your account."
            : destination === "/checkout"
              ? "Sign in to continue checkout."
              : "Sign in to ElectroStore."}
        </h1>
        <p>
          {destination === "/checkout"
            ? "Sign in with Google or your ElectroStore account to continue your purchase."
            : "Keep your favorites close and checkout a little quicker."}
        </p>
        <form onSubmit={submit} className="account-form">
          {registering && (
            <label>
              Your name
              <input
                name="name"
                autoComplete="name"
                required
                placeholder="How should we call you?"
              />
            </label>
          )}
          <label>
            ইমেইল ঠিকানা
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <span className="password-input-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={registering ? "new-password" : "current-password"}
                minLength={registering ? 8 : undefined}
                required
                placeholder={
                  registering ? "At least 8 characters" : "Your password"
                }
              />
              <button
                className="password-visibility-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button dark checkout-button" disabled={busy}>
            {busy
              ? "Please wait..."
              : registering
                ? "Create account"
                : "লগইন"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="account-divider">
          <span>or</span>
        </div>
        {GOOGLE_CLIENT_ID ? (
          <div className={`google-signin${busy ? " is-busy" : ""}`}>
            <div ref={googleButtonRef} />
            {googleError && (
              <p className="form-error" role="alert">
                {googleError}
              </p>
            )}
            {busy && (
              <span className="google-signin-status" role="status">
                Google দিয়ে লগইন হচ্ছে...
              </span>
            )}
          </div>
        ) : (
          <p className="google-signin-config">
            Google sign-in is not configured yet. Add the Google client ID to
            enable it.
          </p>
        )}
        <p className="account-switch">
          {registering ? "Already have an account?" : "New around here?"}{" "}
          <button
            onClick={() => {
              setError("");
              setRegistering(!registering);
            }}
          >
            {registering ? "লগইন" : "Create an account"}
          </button>
        </p>
        <small className="account-api-note">
          অ্যাকাউন্ট ব্যবস্থাপনা সংযুক্ত স্টোর API ব্যবহার করে।
        </small>
      </div>
    </section>
  );
}

const DEFAULT_SITE_CONTENT = {
  storeName: "ইলেক্ট্রোস্টোর",
  announcement: "বাংলাদেশজুড়ে অর্ডার • স্পষ্ট ডেলিভারি চার্জ • অনলাইন পেমেন্ট কনফিগারেশন সাপেক্ষে",
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

function App() {
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem("electrostore-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [cart, setCart] = useState([]);
  const [compareIds, setCompareIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("electrostore-compare-v1") || "[]").slice(0, 3); }
    catch { return []; }
  });
  const [compareOpen, setCompareOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [catalog, setCatalog] = useState(products);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [catalogLive, setCatalogLive] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accountOffline, setAccountOffline] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [toast, setToast] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchToggleRef = useRef(null);
  const previousPathnameRef = useRef(location.pathname);
  const onTokenRefresh = useCallback((token) => setAccessToken(token), []);
  const currentCategory = new URLSearchParams(location.search).get("category");

  useEffect(() => {
    try {
      window.localStorage.setItem("electrostore-theme", theme);
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#0b1220" : "#ffffff");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/site-content`)
      .then((response) => response.json())
      .then((result) => {
        if (active && result?.success && result.data) {
          setSiteContent({ ...DEFAULT_SITE_CONTENT, ...result.data });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);


  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("q") || "");
  }, [location.search]);

  useEffect(() => {
    if (!searchOpen && !mobileOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        searchToggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen, searchOpen]);

  useEffect(() => {
    function updateHeaderState() {
      setHeaderScrolled(location.pathname === "/" && window.scrollY > 24);
    }
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderState);
  }, [location.pathname]);

  useEffect(() => {
    if (previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      setMobileOpen(false);
      setSearchOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    try {
      setCart(readCart());
    } catch (error) {
      setToast(`Saved storefront data could not be loaded: ${error.message}`);
    } finally {
      setCartReady(true);
    }
    let active = true;
    refreshSession()
      .then((session) => {
        if (active) {
          setUser(session.user);
          setAccessToken(session.accessToken);
        }
      })
      .catch((error) => {
        if (active && error instanceof TypeError) setAccountOffline(true);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    fetchCatalogItems("/products?limit=100")
      .then((items) => {
        if (active) {
          setCatalog(items.map(mapApiProduct));
          setCatalogLive(true);
        }
      })
      .catch(() => {
        if (active) setCatalogLive(false);
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    fetchCatalogItems("/categories")
      .then((items) => {
        if (active)
          setCategories(
            items.map((category) => ({
              id: category._id,
              name: category.name,
              slug: category.slug || category._id || slugify(category.name),
              image: category.image || "",
              description: category.description || "",
            })),
          );
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    fetchCatalogItems("/banners")
      .then((items) => {
        if (active) setBanners(items);
      })
      .catch(() => {
        if (active) setBanners([]);
      });
    fetchCatalogItems("/products?sort=newest&limit=4")
      .then((items) => {
        if (active) setNewArrivals(items.map(mapApiProduct));
      })
      .catch(() => {
        if (active) setNewArrivals([]);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      setToast(`Cart changes may not persist: ${error.message}`);
    }
  }, [cart, cartReady]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    try { localStorage.setItem("electrostore-compare-v1", JSON.stringify(compareIds)); } catch {}
  }, [compareIds]);
  function toggleCompare(productId) {
    setCompareIds((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      if (current.length >= 3) { setToast("একসঙ্গে সর্বোচ্চ ৩টি পণ্য তুলনা করা যাবে।"); return current; }
      setToast("পণ্যটি তুলনার তালিকায় যোগ হয়েছে।");
      return [...current, productId];
    });
  }
  const compareProducts = compareIds.map((id) => catalog.find((product) => product.id === id)).filter(Boolean);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  function addToCart(productId) {
    const product = catalog.find((item) => item.id === productId);
    if (product?.stock !== undefined && product.stock < 1) {
      setToast("This item is currently out of stock.");
      return;
    }
    const existing = cart.find((item) => item.productId === productId);
    if (existing?.quantity >= 10) {
      setToast("Maximum quantity is 10 per product.");
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      return existing
        ? current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
              : item,
          )
        : [
            ...current,
            {
              productId,
              quantity: 1,
              snapshot: catalog.find((product) => product.id === productId),
            },
          ];
    });
    setToast(
      `${catalog.find((product) => product.id === productId)?.name || "Item"} added to your cart.`,
    );
    navigate("/cart");
  }
  function setQuantity(productId, quantity) {
    const product = catalog.find((item) => item.id === productId);
    const maxQuantity = Math.max(1, Math.min(10, product?.stock ?? 10));
    setCart((current) =>
      quantity < 1
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(quantity, maxQuantity) }
              : item,
          ),
    );
  }
  function login(data) {
    setUser(data.user);
    setAccessToken(data.accessToken);
    setAccountOffline(false);
  }
  async function logout() {
    try {
      const { response, accessToken: nextToken } = await fetchWithAuth(
        "/auth/logout",
        accessToken,
        {
          method: "POST",
        },
      );
      if (nextToken && nextToken !== accessToken) setAccessToken(nextToken);
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Could not sign out.");
      setUser(null);
      setAccessToken("");
      setAccountOffline(false);
      setToast("You have been signed out.");
    } catch (error) {
      setToast(
        error instanceof TypeError
          ? "Could not connect to sign out. Please try again."
          : error.message,
      );
    }
  }
  function searchSubmit(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    setSearchOpen(false);
    setMobileOpen(false);
    if (!query) setSearch("");
  }
  const clearCart = useCallback(() => setCart([]), []);
  const addCatalogProducts = useCallback((items) => {
    setCatalog((current) => mergeCatalogProducts(current, items));
  }, []);

  return (
    <div className="storefront" data-theme={theme}>
      <div className="announcement">
        <span>{siteContent.announcement || "বাংলাদেশজুড়ে অর্ডার • স্পষ্ট ডেলিভারি চার্জ • অনলাইন পেমেন্ট কনফিগারেশন সাপেক্ষে"}</span>
        <Link to="/shop">
          {siteContent.navShop || "সব পণ্য"} <ArrowRight size={13} />
        </Link>
      </div>
      <header
        className={`store-header${location.pathname === "/" ? " banner-header" : ""}${headerScrolled ? " scrolled" : ""}`}
      >
        <button
          className="mobile-nav-toggle"
          onClick={() => {
            setMobileOpen(!mobileOpen);
            setSearchOpen(false);
          }}
          aria-label={
            mobileOpen ? "ন্যাভিগেশন মেনু বন্ধ করুন" : "ন্যাভিগেশন মেনু খুলুন"
          }
          aria-expanded={mobileOpen}
          aria-controls="main-navigation"
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link
          to="/"
          className="logo"
          onClick={() => setMobileOpen(false)}
          aria-label="ElectroStore home"
        >
          <img className="logo-mark" src="/electrostore-mark.svg" alt="" />
          <span>
            electro<span>store</span>
          </span>
        </Link>
        <nav
          id="main-navigation"
          className={mobileOpen ? "main-nav open" : "main-nav"}
          aria-label="প্রধান নেভিগেশন"
        >
          <Link
            to="/"
            className={location.pathname === "/" ? "active" : ""}
            aria-current={location.pathname === "/" ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
          >
            {siteContent.navHome || "হোম"}
          </Link>
          <Link
            to="/shop"
            className={
              location.pathname === "/shop" && !currentCategory ? "active" : ""
            }
            aria-current={
              location.pathname === "/shop" && !currentCategory
                ? "page"
                : undefined
            }
            onClick={() => setMobileOpen(false)}
          >
            {siteContent.navShop || "সব পণ্য"}
          </Link>
          <Link
            to="/shop?category=audio"
            className={
              location.pathname === "/shop" && currentCategory === "audio"
                ? "active"
                : ""
            }
            aria-current={
              location.pathname === "/shop" && currentCategory === "audio"
                ? "page"
                : undefined
            }
            onClick={() => setMobileOpen(false)}
          >
            অডিও
          </Link>
          <Link
            to="/shop?category=computers"
            className={
              location.pathname === "/shop" && currentCategory === "computers"
                ? "active"
                : ""
            }
            aria-current={
              location.pathname === "/shop" && currentCategory === "computers"
                ? "page"
                : undefined
            }
            onClick={() => setMobileOpen(false)}
          >
            কম্পিউটার
          </Link>
          <Link
            to="/shop?category=lights"
            className={
              location.pathname === "/shop" && currentCategory === "lights"
                ? "active"
                : ""
            }
            aria-current={
              location.pathname === "/shop" && currentCategory === "lights"
                ? "page"
                : undefined
            }
            onClick={() => setMobileOpen(false)}
          >
            স্মার্ট লাইট
          </Link>
          <Link
            to="/shop?category=ebooks"
            className={
              location.pathname === "/shop" && currentCategory === "ebooks"
                ? "active"
                : ""
            }
            aria-current={
              location.pathname === "/shop" && currentCategory === "ebooks"
                ? "page"
                : undefined
            }
            onClick={() => setMobileOpen(false)}
          >
            ই-বুক
          </Link>
        </nav>
        <div className="header-actions">
          <form
            className={searchOpen ? "header-search expanded" : "header-search"}
            role="search"
            aria-label="Store search"
            onSubmit={searchSubmit}
          >
            <input
              ref={searchInputRef}
              aria-label="পণ্য খুঁজুন"
              type="search"
              maxLength={100}
              tabIndex={searchOpen ? 0 : -1}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={siteContent.searchPlaceholder || "পণ্য খুঁজুন..."}
            />
            {searchOpen && (
              <button
                className="search-close"
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  searchToggleRef.current?.focus();
                }}
                aria-label="Close search"
              >
                <X size={17} />
              </button>
            )}
            <button
              ref={searchToggleRef}
              type="button"
              onClick={() => {
                if (searchOpen) searchInputRef.current?.form?.requestSubmit();
                else {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }
              }}
              aria-label={
                searchOpen ? "পণ্য খুঁজুন" : "পণ্য সার্চ খুলুন"
              }
              aria-expanded={searchOpen}
            >
              <Search size={19} />
            </button>
          </form>
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
            title={theme === "dark" ? "লাইট মোড" : "ডার্ক মোড"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === "dark" ? "লাইট" : "ডার্ক"}</span>
          </button>
          <AccountStatus offline={accountOffline && !user} />
          {user ? (
            <>
              <Link className="account-action" to="/orders">
                আমার অর্ডার
              </Link>
              <button
                className="account-action"
                onClick={logout}
                aria-label="লগআউট"
              >
                Hi, {user.name.split(" ")[0]} <span>লগআউট</span>
              </button>
            </>
          ) : (
            <Link className="account-action" to="/login" aria-label="লগইন">
              লগইন
            </Link>
          )}
          <Link
            to="/cart"
            className="bag-action"
            aria-label={`শপিং কার্ট, ${cartCount}টি পণ্য`}
          >
            <ShoppingBag size={20} />
            <span>কার্ট</span>
            {cartCount > 0 && <b>{cartCount}</b>}
          </Link>
        </div>
      </header>
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={catalog}
                categories={categories}
                banners={banners}
                newArrivals={newArrivals}
                onAdd={addToCart}
                onCompare={toggleCompare}
                comparedIds={compareIds}
                catalogLive={catalogLive}
                catalogLoading={catalogLoading}
                siteContent={siteContent}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                products={catalog}
                categories={categories}
                onAdd={addToCart}
                onCompare={toggleCompare}
                comparedIds={compareIds}
                catalogLive={catalogLive}
                catalogLoading={catalogLoading}
                onCatalogProducts={addCatalogProducts}
              />
            }
          />
          <Route
            path="/product/:id"
            element={<ProductPage products={catalog} onAdd={addToCart} />}
          />
          <Route
            path="/cart"
            element={
              <CartPage
                products={catalog}
                cart={cart}
                onQuantity={setQuantity}
                onRemove={(id) => setQuantity(id, 0)}
              />
            }
          />
          <Route
            path="/checkout"
            element={
              !authReady ? (
                <section className="orders-page section">
                  <p role="status">আপনার অ্যাকাউন্ট যাচাই হচ্ছে...</p>
                </section>
              ) : !user ? (
                <Navigate to="/login?next=%2Fcheckout" replace />
              ) : (
                <CheckoutPage
                  products={catalog}
                  catalogLive={catalogLive}
                  cart={cart}
                  user={user}
                  accessToken={accessToken}
                  onTokenRefresh={onTokenRefresh}
                  siteContent={siteContent}
                />
              )
            }
          />
          <Route
            path="/payment/result"
            element={
              <PaymentResultPage
                accessToken={accessToken}
                authReady={authReady}
                onPaid={clearCart}
                onTokenRefresh={onTokenRefresh}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <MyOrdersPage
                user={user}
                accessToken={accessToken}
                authReady={authReady}
                onTokenRefresh={onTokenRefresh}
              />
            }
          />
          <Route
            path="/login"
            element={<AuthPage onLogin={login} user={user} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {compareIds.length > 0 && (
        <aside className="compare-dock" aria-label="পণ্য তুলনা">
          <div className="compare-dock-copy"><span className="compare-dock-icon"><ArrowLeftRight size={18} /></span><span><strong>স্মার্ট তুলনা</strong><small>{compareIds.length}/৩টি পণ্য নির্বাচিত</small></span></div>
          <div className="compare-dock-items">{compareProducts.map((product) => <span key={product.id}>{product.name}</span>)}</div>
          <button className="compare-open-btn" onClick={() => setCompareOpen(true)} disabled={compareProducts.length < 2}>তুলনা দেখুন <ArrowRight size={15} /></button>
          <button className="compare-clear-btn" onClick={() => setCompareIds([])} aria-label="তুলনার তালিকা মুছুন"><X size={17} /></button>
        </aside>
      )}
      {compareOpen && (
        <div className="compare-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCompareOpen(false); }}>
          <section className="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-title">
            <div className="compare-modal-heading"><div><span className="eyebrow">সঠিক সিদ্ধান্ত নিন</span><h2 id="compare-title">পণ্য তুলনা করুন</h2><p>দাম, রেটিং ও স্টক একসঙ্গে দেখে পছন্দ করুন।</p></div><button onClick={() => setCompareOpen(false)} aria-label="বন্ধ করুন"><X size={20} /></button></div>
            <div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>বৈশিষ্ট্য</th>{compareProducts.map((product) => <th key={product.id}><img src={imageUrl(product.image, 240)} alt="" /><strong>{product.name}</strong></th>)}</tr></thead><tbody>
              <tr><th>ব্র্যান্ড</th>{compareProducts.map((p) => <td key={p.id}>{p.brand}</td>)}</tr>
              <tr><th>ক্যাটাগরি</th>{compareProducts.map((p) => <td key={p.id}>{p.category}</td>)}</tr>
              <tr><th>মূল্য</th>{compareProducts.map((p) => <td key={p.id} className="compare-price">{formatPrice(p.price)}</td>)}</tr>
              <tr><th>রেটিং</th>{compareProducts.map((p) => <td key={p.id}>★ {p.rating} <small>({p.reviews} রিভিউ)</small></td>)}</tr>
              <tr><th>স্টক</th>{compareProducts.map((p) => <td key={p.id}>{p.stock === undefined ? "স্টক চেকআউটে যাচাই হবে" : p.stock > 0 ? "স্টকে আছে" : "স্টকে নেই"}</td>)}</tr>
              <tr><th>বিবরণ</th>{compareProducts.map((p) => <td key={p.id}>{p.description}</td>)}</tr>
              <tr><th>অ্যাকশন</th>{compareProducts.map((p) => <td key={p.id}><Link className="button" to={`/product/${p.id}`} onClick={() => setCompareOpen(false)}>বিস্তারিত</Link></td>)}</tr>
            </tbody></table></div>
            <p className="compare-footnote">পণ্যের স্টক ও চূড়ান্ত মূল্য অর্ডারের সময় সার্ভারে পুনরায় যাচাই করা হয়।</p>
          </section>
        </div>
      )}
      <footer className="store-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="logo footer-logo">
              <img className="logo-mark" src="/electrostore-mark.svg" alt="" />
              <span>
                {siteContent.storeName || "ইলেক্ট্রোস্টোর"}
              </span>
            </Link>
            <p>{siteContent.footerAbout || "আপনার প্রতিদিনের প্রযুক্তির বিশ্বস্ত সঙ্গী।"}</p>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <div>
              <strong>এক্সপ্লোর</strong>
              <Link to="/shop">সব পণ্য দেখুন</Link>
              <Link to="/shop?sort=newest">নতুন পণ্য</Link>
              <Link to="/shop?category=phones">মোবাইল</Link>
              <Link to="/shop?category=audio">অডিও</Link>
            </div>
            <div>
              <strong>আপনার ইলেক্ট্রোস্টোর</strong>
              <Link to="/login">আপনার অ্যাকাউন্ট</Link>
              <Link to="/cart">আপনার কার্ট</Link>
              <Link to="/shop?category=computers">কম্পিউটার ও পেরিফেরাল</Link>
              <Link to="/shop?category=lights">লাইট</Link>
              <Link to="/shop?category=ebooks">ই-বুক</Link>
            </div>
            <div className="footer-support">
              <strong>যোগাযোগ</strong>
              <p>{siteContent.footerSupport || "সহায়তা প্রয়োজন? আমাদের সঙ্গে যোগাযোগ করুন।"}</p>
              <a
                className="footer-support-link"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} />
                <span>
                  <b>হোয়াটসঅ্যাপ</b>
                  <small>{WHATSAPP_DISPLAY_NUMBER}</small>
                </span>
              </a>
              <a
                className="footer-support-link"
                href="mailto:prantotarofdar999@gmail.com"
              >
                <Mail size={14} />
                <span>
                  <b>Email</b>
                  <small>prantotarofdar999@gmail.com</small>
                </span>
              </a>
            </div>
            <div className="footer-promise">
              <strong>নিশ্চিন্তে কেনাকাটা করুন</strong>
              <span>
                <ShieldCheck size={15} /> অফিশিয়াল ওয়ারেন্টি
              </span>
              <span>
                <Truck size={15} /> যত্নসহকারে ডেলিভারি
              </span>
              <span>
                <PackageCheck size={15} /> সহজে ফেরত দিন
              </span>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© ২০২৬ ইলেক্ট্রোস্টোর। প্রতিদিনের জন্য।</span>
          <span>সব দাম বাংলাদেশি টাকায় (৳)</span>
        </div>
      </footer>
      <a
        className="whatsapp-float"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`হোয়াটসঅ্যাপে ইলেক্ট্রোস্টোরে যোগাযোগ করুন: ${WHATSAPP_DISPLAY_NUMBER}`}
      >
        <MessageCircle size={22} aria-hidden="true" />
        <span>হোয়াটসঅ্যাপে কথা বলুন</span>
      </a>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="নোটিফিকেশন বন্ধ করুন"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {searchOpen && (
        <button
          className="search-dismiss"
          aria-label="সার্চ প্যানেল বন্ধ করুন"
          onClick={() => {
            setSearchOpen(false);
            searchToggleRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}

export default App;
