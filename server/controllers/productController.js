import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { uploadBufferToCloudinary } from '../config/cloudinary.js';

/**
 * @desc    Get all products with search, filtering, sorting, and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      minRating,
      featured,
      sort = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // 1. Keyword Search (matches name, brand, or description)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { brand: regex }, { description: regex }];
    }

    // 2. Category Filter (accepts either Category ObjectId or Category slug)
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const catDoc = await Category.findOne({ slug: category });
        if (catDoc) {
          query.category = catDoc._id;
        } else {
          // If category slug doesn't exist, return empty result cleanly
          return res.status(200).json({
            success: true,
            products: [],
            page: 1,
            pages: 0,
            total: 0,
            brands: [],
          });
        }
      }
    }

    // 3. Brand Filter
    if (brand) {
      query.brand = { $regex: new RegExp(`^${brand.trim()}$`, 'i') };
    }

    // 4. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        query.price.$lte = Number(maxPrice);
      }
      if (Object.keys(query.price).length === 0) {
        delete query.price;
      }
    }

    // 5. Minimum Rating Filter
    if (minRating) {
      query.ratings = { $gte: Number(minRating) };
    }

    // 6. Featured Products Filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // 7. Sorting Options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { ratings: -1, numReviews: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    // 8. Pagination Calculation
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, products, brands] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Product.distinct('brand'),
    ]);

    res.status(200).json({
      success: true,
      products,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      brands: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live search suggestions for Navbar search bar
 * @route   GET /api/products/suggestions?q=keyword
 * @access  Public
 */
export const getSearchSuggestions = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q, 'i');
    const suggestions = await Product.find({
      $or: [{ name: regex }, { brand: regex }],
    })
      .select('name slug price discountPrice images brand')
      .limit(6)
      .sort({ ratings: -1 });

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID or Slug + related products
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const product = await Product.findOne(
      isObjectId ? { _id: id } : { slug: id }
    ).populate('category', 'name slug');

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // 1. Fetch up to 8 similar products in the same category
    let relatedProducts = await Product.find({
      category: product.category?._id,
      _id: { $ne: product._id },
    })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ ratings: -1, numReviews: -1 });

    // If category has fewer than 4 other products, supplement with top-rated products
    if (relatedProducts.length < 4) {
      const excludeIds = [product._id, ...relatedProducts.map((p) => p._id)];
      const extraProducts = await Product.find({
        _id: { $nin: excludeIds },
      })
        .populate('category', 'name slug')
        .limit(8 - relatedProducts.length)
        .sort({ ratings: -1, isFeatured: -1 });
      relatedProducts = [...relatedProducts, ...extraProducts];
    }

    // 2. Fetch "Customers Also Viewed / Similar Price & Brand" alternatives
    const effectivePrice =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;
    const minSimilarPrice = Math.max(0, Math.round(effectivePrice * 0.4));
    const maxSimilarPrice = Math.round(effectivePrice * 1.8);

    const similarAlternatives = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { brand: product.brand },
        { price: { $gte: minSimilarPrice, $lte: maxSimilarPrice } },
      ],
    })
      .populate('category', 'name slug')
      .limit(8)
      .sort({ ratings: -1, numReviews: -1 });

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
      similarAlternatives,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin / Manager)
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      category,
      brand,
      images,
      variants,
      stock,
      isFeatured,
    } = req.body;

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      category,
      brand,
      images: Array.isArray(images) ? images : [],
      variants: Array.isArray(variants) ? variants : [],
      stock: Number(stock) || 0,
      isFeatured: Boolean(isFeatured),
    });

    const populated = await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Admin / Manager)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const fields = [
      'name',
      'description',
      'price',
      'discountPrice',
      'category',
      'brand',
      'images',
      'variants',
      'stock',
      'isFeatured',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    const updated = await product.save();
    await updated.populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Admin)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload up to 5 product images to Cloudinary
 * @route   POST /api/products/upload
 * @access  Private (Admin / Manager)
 */
export const uploadProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error('Please select at least one image file to upload');
    }

    const uploadedUrls = await Promise.all(
      req.files.map((file) =>
        uploadBufferToCloudinary(file.buffer, file.mimetype, 'shopease/products')
      )
    );

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      images: uploadedUrls,
    });
  } catch (error) {
    next(error);
  }
};
