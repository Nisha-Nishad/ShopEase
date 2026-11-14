import mongoose from 'mongoose';

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const variantSchema = new mongoose.Schema(
  {
    size: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [140, 'Product name cannot exceed 140 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    variants: [variantSchema],
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        if (Array.isArray(ret.images)) {
          ret.images = ret.images.map((img) =>
            typeof img === 'string' && img.includes('1584990347449-a2d4c2c044c9')
              ? 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80'
              : img
          );
        }
        return ret;
      },
    },
  }
);

// MongoDB Text Index for fast full-text search on name, brand, and description
productSchema.index(
  { name: 'text', brand: 'text', description: 'text' },
  { weights: { name: 5, brand: 3, description: 1 } }
);

// Automatically generate a unique slug before saving
productSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    const baseSlug = slugify(this.name);
    const shortId = this._id
      ? this._id.toString().slice(-5)
      : Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug}-${shortId}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
