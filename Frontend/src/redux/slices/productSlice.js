import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// 1. Fetch products with filters, search, sort, and pagination
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products', { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load products'
      );
    }
  }
);

// 2. Fetch single product by ID or slug + related products
export const fetchProductDetails = createAsyncThunk(
  'products/fetchProductDetails',
  async (idOrSlug, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/products/${idOrSlug}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Product not found'
      );
    }
  }
);

// 3. Fetch all categories
export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/categories');
      return data.categories;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to load categories'
      );
    }
  }
);

const initialState = {
  products: [],
  categories: [],
  brands: [],
  page: 1,
  pages: 1,
  total: 0,
  currentProduct: null,
  relatedProducts: [],
  similarAlternatives: [],
  loading: false,
  detailLoading: false,
  error: null,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.relatedProducts = [];
      state.similarAlternatives = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products List
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
        state.brands = action.payload.brands || [];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Single Product Details
      .addCase(fetchProductDetails.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProduct = action.payload.product;
        state.relatedProducts = action.payload.relatedProducts || [];
        state.similarAlternatives = action.payload.similarAlternatives || [];
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Fetch Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
});

export const { clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
