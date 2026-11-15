import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProductDetails,
  clearCurrentProduct,
} from '../redux/slices/productSlice';
import { addItemToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { formatPrice, getDiscountPercent } from '../utils/formatPrice';
import {
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Check,
  Trash2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    currentProduct: product,
    relatedProducts,
    similarAlternatives = [],
    detailLoading,
    error,
  } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState(false);
  const [similarTab, setSimilarTab] = useState('category'); // 'category' | 'alternatives' | 'compare'
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    dispatch(fetchProductDetails(id));
    setSelectedImage(0);
    setSelectedVariantIndex(0);
    setQuantity(1);
    setSimilarTab('category');
    setShowReviewBox(false);
    setReviewError('');
    setReviewSuccess('');
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  // Track & load Recently Viewed Products in localStorage
  useEffect(() => {
    if (!product?._id) return;
    try {
      const raw = localStorage.getItem('shopease_recently_viewed');
      const list = raw ? JSON.parse(raw) : [];
      const others = list.filter((item) => item._id !== product._id);
      setRecentlyViewed(others.slice(0, 4));

      const updated = [
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: product.price,
          discountPrice: product.discountPrice,
          ratings: product.ratings,
          numReviews: product.numReviews,
          stock: product.stock,
          images: product.images,
          category: product.category,
        },
        ...others,
      ].slice(0, 8);
      localStorage.setItem('shopease_recently_viewed', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, [product]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!product?._id) return;
      try {
        const { data } = await api.get(`/products/${product._id}/reviews`);
        setReviews(data.reviews || []);
      } catch {
        setReviews([]);
      }
    };
    loadReviews();
  }, [product?._id]);

  if (detailLoading) {
    return (
      <div className="py-24 flex justify-center">
        <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          {error || 'Product not found'}
        </h2>
        <Link
          to="/products"
          className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const effectivePrice =
    product.discountPrice && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  const discountPercent = getDiscountPercent(
    product.price,
    product.discountPrice
  );
  const fallbackImage =
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80';
  const images =
    product.images?.length > 0
      ? product.images.map((img) =>
          img.includes('1584990347449-a2d4c2c044c9') ? fallbackImage : img
        )
      : [fallbackImage];
  const activeVariant = product.variants?.[selectedVariantIndex] || null;
  const availableStock = activeVariant ? activeVariant.stock : product.stock;
  const isWishlisted = wishlistItems.some((item) => item._id === product._id);

  const handleAddToCart = () => {
    if (availableStock <= 0) return;
    dispatch(
      addItemToCart({
        product,
        quantity: 1,
        variant: {
          size: activeVariant?.size || '',
          color: activeVariant?.color || '',
        },
      })
    );
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 1800);
  };

  const handleBuyNow = async () => {
    if (availableStock <= 0) return;
    await dispatch(
      addItemToCart({
        product,
        quantity: 1,
        variant: {
          size: activeVariant?.size || '',
          color: activeVariant?.color || '',
        },
      })
    );
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const { data } = await api.post(`/products/${product._id}/reviews`, {
        rating: ratingInput,
        comment: commentInput,
      });
      setReviews(data.reviews || []);
      setCommentInput('');
      setShowReviewBox(false);
      setReviewSuccess(data.message);
      dispatch(fetchProductDetails(id));
    } catch (err) {
      setReviewError(
        err.response?.data?.message || 'Failed to submit review'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/products/${product._id}/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      dispatch(fetchProductDetails(id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  return (
    <div className="py-4 sm:py-8 space-y-8 sm:space-y-14">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap no-scrollbar">
        <Link to="/" className="hover:text-indigo-600 shrink-0">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/products" className="hover:text-indigo-600 shrink-0">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-indigo-600 shrink-0"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-slate-800 font-medium truncate max-w-[180px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* Main Product Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
            <img
              src={images[selectedImage] || images[0]}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackImage;
              }}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                    selectedImage === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-200'
                      : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackImage;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {product.brand}
              </span>

              {availableStock > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock ({availableStock} available)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-3 py-1 rounded-full">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Out of Stock</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-sm font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{Number(product.ratings || 0).toFixed(1)}</span>
              </div>
              <span className="text-sm text-slate-500">
                Based on {product.numReviews || 0} verified ratings
              </span>
            </div>

            {/* Price */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-900">
                {formatPrice(effectivePrice)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                    Save {discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed pt-2">
              {product.description}
            </p>

            {/* Variants (Size / Color) */}
            {product.variants?.length > 0 && (
              <div className="pt-3 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Variant (Size / Color)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v, idx) => {
                    const label = [v.size, v.color].filter(Boolean).join(' • ');
                    return (
                      <button
                        key={v._id || idx}
                        type="button"
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selectedVariantIndex === idx
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-300 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buy Now, Add to Cart & Wishlist */}
            <div className="pt-3 sm:pt-4 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={availableStock <= 0}
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-semibold px-3 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 sm:w-4 sm:h-4" />
                <span>{availableStock > 0 ? 'Buy Now' : 'Out of Stock'}</span>
              </button>

              <button
                type="button"
                disabled={availableStock <= 0}
                onClick={handleAddToCart}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm font-semibold px-3 py-2.5 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl transition-colors cursor-pointer disabled:bg-slate-300 ${
                  addedMessage
                    ? 'bg-emerald-600'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {addedMessage ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => dispatch(toggleWishlist(product))}
                title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-slate-300 text-slate-700 hover:text-rose-600 hover:border-rose-300'
                }`}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Delivery & Warranty Perks */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>Free express delivery on orders over ₹499</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>7-day easy replacement &amp; 100% genuine guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal & Stylish Customer Reviews Section */}
      <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-7 space-y-5 shadow-2xs">
        {/* Compact Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-extrabold text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{Number(product.ratings || 0).toFixed(1)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Customer Reviews
                </h2>
                <span className="text-xs font-semibold text-slate-400">
                  ({reviews.length})
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                100% verified buyer feedback
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                setShowReviewBox((prev) => !prev);
                setReviewError('');
              }}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer ${
                showReviewBox
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-2xs'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{showReviewBox ? 'Close' : 'Write a Review'}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Sign in to Review</span>
            </Link>
          )}
        </div>

        {/* Status Alerts */}
        {reviewError && (
          <div className="text-xs font-medium text-red-600 bg-red-50/80 px-3.5 py-2.5 rounded-xl border border-red-200/80">
            {reviewError}
          </div>
        )}
        {reviewSuccess && (
          <div className="text-xs font-medium text-emerald-700 bg-emerald-50/80 px-3.5 py-2.5 rounded-xl border border-emerald-200/80">
            {reviewSuccess}
          </div>
        )}

        {/* Sleek Collapsible Star-Picker Composer */}
        {isAuthenticated && showReviewBox && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3.5 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Tap to Rate:
                </span>
                <div className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      className="p-0.5 transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= ratingInput
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-indigo-600">
                  {ratingInput === 5
                    ? 'Excellent'
                    : ratingInput === 4
                    ? 'Very Good'
                    : ratingInput === 3
                    ? 'Good'
                    : ratingInput === 2
                    ? 'Fair'
                    : 'Poor'}
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                Verified buyers only
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Share your honest experience with this product..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {reviewSubmitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
          </form>
        )}

        {/* Minimal Reviews Feed */}
        {reviews.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-amber-400/30" />
                ))}
              </div>
              <span>
                No reviews yet — be the first verified buyer to share your
                thoughts!
              </span>
            </div>
            {isAuthenticated && !showReviewBox && (
              <button
                type="button"
                onClick={() => setShowReviewBox(true)}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                + Rate this product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {reviews.map((rev) => {
              const canDelete =
                user &&
                (user._id === rev.user?._id ||
                  user.role === 'admin' ||
                  user.role === 'manager');
              const initial = (rev.user?.name || 'C').charAt(0).toUpperCase();
              return (
                <div
                  key={rev._id}
                  className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {rev.user?.name || 'Customer'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="inline-flex items-center gap-0.5 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-xs font-bold text-slate-800">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{rev.rating}</span>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev._id)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-9">
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Similar / Related Products Section */}
      {(relatedProducts.length > 0 || similarAlternatives.length > 0) && (
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended For You</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Similar &amp; Related Products
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSimilarTab('category')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    similarTab === 'category'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Same Category ({relatedProducts.length})
                </button>
                {similarAlternatives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSimilarTab('alternatives')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      similarTab === 'alternatives'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Similar Price &amp; Brand ({similarAlternatives.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSimilarTab('compare')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    similarTab === 'compare'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compare Specs
                </button>
              </div>

              {product.category?.slug && (
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <span>View All {product.category.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {similarTab === 'compare' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-3">Availability</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {[product, ...relatedProducts.slice(0, 4)].map((item, idx) => {
                    const itemPrice =
                      item.discountPrice && item.discountPrice > 0
                        ? item.discountPrice
                        : item.price;
                    const isCurrent = item._id === product._id;
                    const itemImg =
                      item.images?.[0] &&
                      !item.images[0].includes('1584990347449-a2d4c2c044c9')
                        ? item.images[0]
                        : fallbackImage;
                    return (
                      <tr
                        key={item._id || idx}
                        className={isCurrent ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={itemImg}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = fallbackImage;
                              }}
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <Link
                                to={`/products/${item.slug || item._id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {item.name}
                              </Link>
                              {isCurrent && (
                                <span className="inline-block text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full mt-0.5">
                                  Currently Viewing
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {item.brand}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900">
                          {formatPrice(itemPrice)}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {Number(item.ratings || 0).toFixed(1)} ({item.numReviews || 0})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {item.stock > 0 ? (
                            <span className="text-xs font-semibold text-emerald-700">
                              In Stock ({item.stock})
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-red-600">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isCurrent ? (
                            <span className="text-xs font-semibold text-slate-400">
                              Selected
                            </span>
                          ) : (
                            <Link
                              to={`/products/${item.slug || item._id}`}
                              className="inline-block bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              View Item
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {(similarTab === 'alternatives' && similarAlternatives.length > 0
                ? similarAlternatives
                : relatedProducts
              ).map((rel) => (
                <ProductCard key={rel._id} product={rel} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Recently Viewed By You
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('shopease_recently_viewed');
                setRecentlyViewed([]);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {recentlyViewed.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
