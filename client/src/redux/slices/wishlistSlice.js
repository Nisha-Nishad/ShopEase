import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const GUEST_WISHLIST_KEY = 'shopease_guest_wishlist';

const loadGuestWishlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveGuestWishlist = (items) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;
      if (!isAuthenticated) {
        return loadGuestWishlist();
      }
      const { data } = await api.get('/wishlist');
      return data.products || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load wishlist'
      );
    }
  }
);

export const toggleWishlist = createAsyncThunk(
  'wishlist/toggleWishlist',
  async (product, { getState, rejectWithValue }) => {
    try {
      const { isAuthenticated } = getState().auth;
      if (isAuthenticated) {
        const { data } = await api.post('/wishlist/toggle', {
          productId: product._id,
        });
        return data.products || [];
      }

      // Guest wishlist in localStorage
      const current = loadGuestWishlist();
      const exists = current.some((p) => p._id === product._id);
      const updated = exists
        ? current.filter((p) => p._id !== product._id)
        : [...current, product];
      saveGuestWishlist(updated);
      return updated;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update wishlist'
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: loadGuestWishlist(),
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  },
});

export default wishlistSlice.reducer;
