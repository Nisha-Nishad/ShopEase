import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const GUEST_CART_KEY = 'shopease_guest_cart';

// Helper to read guest cart from localStorage
const loadGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Helper to calculate totalPrice for guest cart items
const calculateTotal = (items) =>
  items.reduce((sum, item) => {
    const p = item.product || {};
    const unitPrice =
      p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.price || 0;
    return sum + unitPrice * (item.quantity || 1);
  }, 0);

// Helper to save guest cart to localStorage
const saveGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
};

/**
 * 1. Sync & Merge Cart:
 * When authenticated, merges any localStorage guest items into MongoDB (/api/cart/merge),
 * clears localStorage, and loads the server cart.
 * When guest, loads items from localStorage.
 */
export const syncAndMergeCart = createAsyncThunk(
  'cart/syncAndMergeCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;
      const guestItems = loadGuestCart();

      if (!isAuthenticated) {
        return {
          items: guestItems,
          totalPrice: calculateTotal(guestItems),
        };
      }

      if (guestItems.length > 0) {
        const { data } = await api.post('/cart/merge', { items: guestItems });
        localStorage.removeItem(GUEST_CART_KEY);
        return data.cart;
      }

      const { data } = await api.get('/cart');
      return data.cart;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to sync cart'
      );
    }
  }
);

/**
 * 2. Add Item to Cart (works for both Guest & Logged-in users)
 */
export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async ({ product, quantity = 1, variant = {} }, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;
      const size = variant.size || '';
      const color = variant.color || '';

      if (isAuthenticated) {
        const { data } = await api.post('/cart', {
          productId: product._id,
          quantity,
          variant: { size, color },
        });
        return data.cart;
      }

      // Guest Cart (localStorage)
      const guestItems = loadGuestCart();
      const existingIndex = guestItems.findIndex(
        (item) =>
          item.product?._id === product._id &&
          (item.variant?.size || '') === size &&
          (item.variant?.color || '') === color
      );

      if (existingIndex > -1) {
        guestItems[existingIndex].quantity = Math.min(
          product.stock || 99,
          guestItems[existingIndex].quantity + quantity
        );
      } else {
        guestItems.push({
          _id: `${product._id}-${size}-${color}`,
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            discountPrice: product.discountPrice,
            images: product.images,
            stock: product.stock,
            brand: product.brand,
          },
          quantity,
          variant: { size, color },
        });
      }

      saveGuestCart(guestItems);
      return {
        items: guestItems,
        totalPrice: calculateTotal(guestItems),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add item to cart'
      );
    }
  }
);

/**
 * 3. Update Cart Item Quantity (works for both Guest & Logged-in users)
 */
export const updateItemQuantity = createAsyncThunk(
  'cart/updateItemQuantity',
  async ({ itemId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;

      if (isAuthenticated) {
        const { data } = await api.put(`/cart/${itemId}`, { quantity });
        return data.cart;
      }

      let guestItems = loadGuestCart();
      if (quantity <= 0) {
        guestItems = guestItems.filter((item) => item._id !== itemId);
      } else {
        guestItems = guestItems.map((item) =>
          item._id === itemId
            ? {
                ...item,
                quantity: Math.min(item.product?.stock || 99, quantity),
              }
            : item
        );
      }

      saveGuestCart(guestItems);
      return {
        items: guestItems,
        totalPrice: calculateTotal(guestItems),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update quantity'
      );
    }
  }
);

/**
 * 4. Remove Item from Cart (works for both Guest & Logged-in users)
 */
export const removeItemFromCart = createAsyncThunk(
  'cart/removeItemFromCart',
  async (itemId, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;

      if (isAuthenticated) {
        const { data } = await api.delete(`/cart/${itemId}`);
        return data.cart;
      }

      const guestItems = loadGuestCart().filter((item) => item._id !== itemId);
      saveGuestCart(guestItems);
      return {
        items: guestItems,
        totalPrice: calculateTotal(guestItems),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to remove item'
      );
    }
  }
);

/**
 * 5. Clear Entire Cart
 */
export const clearEntireCart = createAsyncThunk(
  'cart/clearEntireCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;
      if (isAuthenticated) {
        await api.delete('/cart');
      }
      localStorage.removeItem(GUEST_CART_KEY);
      return { items: [], totalPrice: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to clear cart'
      );
    }
  }
);

const initialGuestItems = loadGuestCart();

const initialState = {
  items: initialGuestItems,
  totalPrice: calculateTotal(initialGuestItems),
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartOnLogout: (state) => {
      const guest = loadGuestCart();
      state.items = guest;
      state.totalPrice = calculateTotal(guest);
    },
  },
  extraReducers: (builder) => {
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.error = null;
      state.items = action.payload?.items || [];
      state.totalPrice = action.payload?.totalPrice || 0;
    };

    builder
      .addCase(syncAndMergeCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncAndMergeCart.fulfilled, handleFulfilled)
      .addCase(syncAndMergeCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(addItemToCart.fulfilled, handleFulfilled)
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateItemQuantity.fulfilled, handleFulfilled)
      .addCase(removeItemFromCart.fulfilled, handleFulfilled)
      .addCase(clearEntireCart.fulfilled, handleFulfilled);
  },
});

export const { resetCartOnLogout } = cartSlice.actions;
export default cartSlice.reducer;
