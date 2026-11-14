import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchCategories } from '../redux/slices/productSlice';
import ProductCard from '../components/ProductCard';
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const Products = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { products, categories, brands, page, pages, total, loading } =
    useSelector((state) => state.products);

  // Read active query params from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const featured = searchParams.get('featured') || '';
  const sort = searchParams.get('sort') || 'newest';
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 12;

  const activeFilterCount = [
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    featured,
  ].filter(Boolean).length;

  // Local state for price inputs before clicking Apply
  const [priceRange, setPriceRange] = useState({
    min: minPrice,
    max: maxPrice,
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({
        search: search || undefined,
        category: category || undefined,
        brand: brand || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
        featured: featured || undefined,
        sort,
        page: currentPage,
        limit,
      })
    );
  }, [
    dispatch,
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    featured,
    sort,
    currentPage,
    limit,
  ]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (priceRange.min) next.set('minPrice', priceRange.min);
    else next.delete('minPrice');
    if (priceRange.max) next.set('maxPrice', priceRange.max);
    else next.delete('maxPrice');
    next.set('page', '1');
    setSearchParams(next);
    setMobileFiltersOpen(false);
  };

  const resetAllFilters = () => {
    setPriceRange({ min: '', max: '' });
    setSearchParams({});
    setMobileFiltersOpen(false);
  };

  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* 1. Category Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => updateFilter('category', '')}
            className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              !category
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => updateFilter('category', cat.slug)}
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                category === cat.slug
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Brand Filter */}
      {brands.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            Brand
          </h3>
          <select
            value={brand}
            onChange={(e) => updateFilter('brand', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-600"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Price Range Filter */}
      <form onSubmit={handlePriceApply} className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Price Range (₹)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: e.target.value })
            }
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: e.target.value })
            }
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer"
        >
          Apply Price
        </button>
      </form>

      {/* 4. Customer Rating Filter */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Customer Rating
        </h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() =>
                updateFilter(
                  'minRating',
                  minRating === String(stars) ? '' : String(stars)
                )
              }
              className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                minRating === String(stars)
                  ? 'bg-amber-50 text-amber-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {stars}★ &amp; above
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-4 sm:py-8 space-y-4">
      {/* Mobile Quick Category Horizontal Strip */}
      {categories.length > 0 && (
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => updateFilter('category', '')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
              !category
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => updateFilter('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                category === cat.slug
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Filter Drawer Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl max-h-[82vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {renderFilterControls()}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Show {total} Products
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Filters</span>
              </div>
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {renderFilterControls()}
          </div>
        </aside>

        {/* Main Product Listing Area */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Top Bar: Result Count, Mobile Filter Button & Sort Dropdown */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 px-3.5 py-3 sm:px-5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
            <div className="text-xs sm:text-sm text-slate-600">
              Showing{' '}
              <span className="font-bold text-slate-900">
                {products.length}
              </span>{' '}
              of <span className="font-bold text-slate-900">{total}</span>{' '}
              products
              {search && (
                <span>
                  {' '}
                  for{' '}
                  <strong className="text-indigo-600">
                    &ldquo;{search}&rdquo;
                  </strong>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4 text-xs sm:text-sm">
              {/* Mobile Filter Trigger Button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-slate-500">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => updateFilter('limit', e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="9">9 per page</option>
                  <option value="12">12 per page</option>
                  <option value="24">24 per page</option>
                  <option value="60">All (60 per page)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0">
                <span className="text-slate-500 hidden xs:inline">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-600"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3">
              <p className="text-base sm:text-lg font-bold text-slate-800">
                No matching products found
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Try clearing some filters or searching with a different keyword.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateFilter('page', String(page - 1))}
                className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pages }, (_, idx) => idx + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateFilter('page', String(num))}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    page === num
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                disabled={page >= pages}
                onClick={() => updateFilter('page', String(page + 1))}
                className="p-2 rounded-xl border border-slate-300 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
