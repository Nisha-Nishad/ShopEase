import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  CreditCard,
  Sparkles,
} from 'lucide-react';

const Home = () => {
  const dispatch = useDispatch();
  const { products, categories, loading } = useSelector((state) => state.products);

  const [catIndex, setCatIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(5);
  const [isPaused, setIsPaused] = useState(false);

  const [featIndex, setFeatIndex] = useState(0);
  const [featItemsPerView, setFeatItemsPerView] = useState(4);
  const [isFeatPaused, setIsFeatPaused] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchProducts({ limit: 80, sort: 'newest' }));
  }, [dispatch]);

  const featuredProducts = products.filter((p) => p.isFeatured);
  const extendedFeaturedProducts =
    featuredProducts.length > 0
      ? [...featuredProducts, ...featuredProducts]
      : [];
  const newArrivals = products.slice(0, 12);

  // Responsive cards per row for Category (5) and Featured Picks (4) sliders
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(2);
        setFeatItemsPerView(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(3);
        setFeatItemsPerView(2);
      } else {
        setItemsPerView(5);
        setFeatItemsPerView(4);
      }
    };
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Auto-run category carousel every 10 seconds (10000ms)
  useEffect(() => {
    if (categories.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCatIndex((prev) => (prev + 1) % categories.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [categories.length, isPaused]);

  // Auto-run Featured Picks carousel (14 featured products)
  useEffect(() => {
    if (featuredProducts.length <= 1 || isFeatPaused) return;
    const timer = setInterval(() => {
      setFeatIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredProducts.length, isFeatPaused]);

  const handlePrevCategory = () => {
    if (categories.length === 0) return;
    setCatIndex((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const handleNextCategory = () => {
    if (categories.length === 0) return;
    setCatIndex((prev) => (prev + 1) % categories.length);
  };

  const handlePrevFeatured = () => {
    if (featuredProducts.length === 0) return;
    setFeatIndex(
      (prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length
    );
  };

  const handleNextFeatured = () => {
    if (featuredProducts.length === 0) return;
    setFeatIndex((prev) => (prev + 1) % featuredProducts.length);
  };

  const extendedCategories =
    categories.length > 0 ? [...categories, ...categories] : [];

  const defaultHeroImages = [
    { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80' },
    { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80' },
    { name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
    { name: 'Home & Living', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80' },
    { name: 'Beauty & Care', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80' },
    { name: 'Sports & Fitness', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80' },
    { name: 'Books & Stationery', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80' },
    { name: 'Gaming & Toys', image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&auto=format&fit=crop&q=80' },
    { name: 'Groceries & Gourmet', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80' },
    { name: 'Jewelry & Watches', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80' },
    { name: 'Bags & Luggage', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80' },
  ];

  const heroSlideItems = categories.length > 0 ? categories : defaultHeroImages;
  const heroMarqueeItems = [...heroSlideItems, ...heroSlideItems];

  return (
    <div className="space-y-9 sm:space-y-14 py-4 sm:py-6">
      {/* 1. Sleek & Minimal Premium Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 text-white px-4 py-8 sm:px-10 sm:py-14 text-center flex items-center justify-center border border-slate-800/80 shadow-sm">
        {/* Continuous Scrolling Category Images Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-hero-marquee h-full flex items-center gap-2">
            {heroMarqueeItems.map((cat, idx) => (
              <div
                key={`${cat.name}-${idx}`}
                className="relative h-full w-44 sm:w-64 shrink-0 overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover opacity-50"
                />
              </div>
            ))}
          </div>
          {/* Refined Luxury Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/65 to-slate-950/85" />
        </div>

        {/* Premium Minimal Centered Content */}
        <div className="relative z-10 max-w-xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] uppercase text-amber-100/90">
              New Season Collection
            </span>
          </div>

          <h1 className="text-xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
            Upgrade Your Lifestyle With{' '}
            <span className="font-extrabold">
              <span className="text-white">Shop</span>
              <span className="text-indigo-400">Ease</span>
            </span>
          </h1>

          <div className="pt-1">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full border border-indigo-400/30 shadow-sm transition-all"
            >
              <span>Shop All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (Single-Line Auto-Running Carousel - 10s Interval) */}
      {categories.length > 0 && (
        <section
          className="space-y-3.5 sm:space-y-5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-end sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                Shop by Category
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                Browse curated collections tailored for you
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevCategory}
                  aria-label="Previous Category"
                  className="p-1.5 sm:p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextCategory}
                  aria-label="Next Category"
                  className="p-1.5 sm:p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                to="/products"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex flex-nowrap transition-transform duration-700 ease-in-out -mx-1.5 sm:-mx-2"
              style={{
                transform: `translateX(-${catIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {extendedCategories.map((cat, idx) => (
                <div
                  key={`${cat._id}-${idx}`}
                  className="w-1/2 sm:w-1/3 lg:w-1/5 shrink-0 px-1.5 sm:px-2"
                >
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="block group bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-2 sm:p-3 hover:border-indigo-500 hover:shadow-sm transition-all text-center space-y-2 h-full"
                  >
                    <div className="aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-slate-100">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {cat.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-indigo-600 truncate">
                      {cat.name}
                    </p>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {categories.map((cat, idx) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setCatIndex(idx)}
                aria-label={`Slide to ${cat.name}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  catIndex === idx
                    ? 'w-6 bg-indigo-600'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Featured Picks (Auto-Running Carousel - 14 Featured Products) */}
      {featuredProducts.length > 0 && (
        <section
          className="space-y-3.5 sm:space-y-5"
          onMouseEnter={() => setIsFeatPaused(true)}
          onMouseLeave={() => setIsFeatPaused(false)}
        >
          <div className="flex items-end sm:items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
                Featured Picks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">
                Handpicked top-rated products at special prices
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevFeatured}
                  aria-label="Previous Featured Product"
                  className="p-1.5 sm:p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextFeatured}
                  aria-label="Next Featured Product"
                  className="p-1.5 sm:p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <Link
                to="/products?featured=true"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span className="hidden sm:inline">See All Featured</span>
                <span className="sm:hidden">See All</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>

          <div className="overflow-hidden py-1">
            <div
              className="flex flex-nowrap transition-transform duration-700 ease-in-out -mx-1.5 sm:-mx-3"
              style={{
                transform: `translateX(-${featIndex * (100 / featItemsPerView)}%)`,
              }}
            >
              {extendedFeaturedProducts.map((product, idx) => (
                <div
                  key={`${product._id}-${idx}`}
                  className="w-1/2 sm:w-1/2 lg:w-1/4 shrink-0 px-1.5 sm:px-3"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Indicator Dots for Featured Picks */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1">
            {featuredProducts.map((product, idx) => (
              <button
                key={product._id}
                type="button"
                onClick={() => setFeatIndex(idx)}
                aria-label={`Slide to ${product.name}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  featIndex === idx
                    ? 'w-5 sm:w-6 bg-indigo-600'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. New Arrivals */}
      <section className="space-y-3.5 sm:space-y-5">
        <div className="flex items-end sm:items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              New Arrivals
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              Freshly added products across all categories
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-2">
            <p className="font-semibold text-slate-800">No products in database yet</p>
            <p className="text-xs sm:text-sm text-slate-500">
              Run <code className="bg-slate-100 px-2 py-0.5 rounded">npm run seed</code> in your project root to populate sample categories and products!
            </p>
          </div>
        )}
      </section>

      {/* 5. Trust & Service Guarantees */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 flex items-start gap-3.5 sm:gap-4">
          <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900">
              Fast &amp; Free Delivery
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              Free shipping on all orders above ₹499 across India.
            </p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 flex items-start gap-3.5 sm:gap-4">
          <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900">
              100% Authentic Products
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              Every item is verified directly from authorized brand partners.
            </p>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 flex items-start gap-3.5 sm:gap-4">
          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-slate-900">
              Secure Payments
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1">
              Pay safely with UPI, Cards, NetBanking via Razorpay, or Cash on Delivery.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
