import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(140),
  brand: z.string().trim().min(1, 'Brand is required'),
  category: z.string().trim().min(1, 'Category ID is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or greater'),
  discountPrice: z.coerce.number().min(0).optional().default(0),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  description: z.string().trim().min(5, 'Description is required'),
  images: z.array(z.string()).optional().default([]),
  variants: z
    .array(
      z.object({
        size: z.string().optional().default(''),
        color: z.string().optional().default(''),
        stock: z.coerce.number().int().min(0).default(0),
      })
    )
    .optional()
    .default([]),
  isFeatured: z.boolean().optional().default(false),
});

export const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .trim()
    .min(3, 'Review comment must be at least 3 characters')
    .max(600, 'Comment cannot exceed 600 characters'),
});

export const orderCreateSchema = z.object({
  orderItems: z
    .array(
      z.object({
        product: z.any(),
        qty: z.coerce.number().int().min(1).optional(),
        quantity: z.coerce.number().int().min(1).optional(),
        variant: z
          .object({
            size: z.string().optional().default(''),
            color: z.string().optional().default(''),
          })
          .optional(),
      })
    )
    .min(1, 'Order must contain at least 1 item'),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, 'Full name is required'),
    phone: z.string().trim().min(6, 'Valid phone number is required'),
    street: z.string().trim().min(3, 'Street address is required'),
    city: z.string().trim().min(2, 'City is required'),
    state: z.string().trim().min(2, 'State is required'),
    postalCode: z.string().trim().min(4, 'PIN/Postal code is required'),
    country: z.string().trim().optional().default('India'),
  }),
  paymentMethod: z.enum(['COD', 'Razorpay']).optional().default('COD'),
  couponCode: z.string().trim().optional().default(''),
});
