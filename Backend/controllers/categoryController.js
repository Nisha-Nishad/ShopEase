import Category from '../models/Category.js';
import Product from '../models/Product.js';

const EXTRA_CATEGORIES = [
  {
    name: 'Books & Stationery',
    description:
      'Bestselling books, luxury journals, fountain pens, and desk essentials',
    image:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gaming & Toys',
    description:
      'Next-gen gaming consoles, wireless controllers, RGB gear, and collectibles',
    image:
      'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Groceries & Gourmet',
    description:
      'Artisanal roasted coffee, organic honey, premium dry fruits, and dark chocolates',
    image:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Jewelry & Watches',
    description:
      '925 sterling silver jewelry, minimal gold-plated necklaces, rings, and earrings',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Bags & Luggage',
    description:
      'Polycarbonate cabin trolley suitcases, travel duffles, and commuter bags',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  },
];

const buildExtraProducts = (catMap) => [
  // Books & Stationery
  {
    name: 'Atomic Habits & Deep Work Hardcover Bestseller Box Set',
    description:
      'Collector hardcover edition pairing two iconic productivity and habit-building books with archival acid-free paper and ribbon bookmark.',
    price: 1499,
    discountPrice: 999,
    category: catMap['Books & Stationery'],
    brand: 'Penguin',
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: 'Hardcover Set', color: 'Classic Edition', stock: 45 }],
    stock: 45,
    ratings: 4.9,
    numReviews: 215,
    isFeatured: true,
  },
  {
    name: 'Moleskine Classic Leather Hardcover Dotted Journal (240 Pages)',
    description:
      'Ivory-colored 100 gsm acid-free dotted pages bound in vegan leather with elastic closure, expandable inner pocket, and lay-flat binding.',
    price: 2199,
    discountPrice: 1699,
    category: catMap['Books & Stationery'],
    brand: 'Moleskine',
    images: [
      'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: 'A5 Large', color: 'Sapphire Blue', stock: 25 },
      { size: 'A5 Large', color: 'Obsidian Black', stock: 25 },
    ],
    stock: 50,
    ratings: 4.7,
    numReviews: 94,
    isFeatured: false,
  },
  {
    name: 'Lamy Safari Matte Charcoal Fountain Pen (Fine Nib)',
    description:
      'German-engineered ergonomic fountain pen with black chromium-plated steel nib, rugged ABS body, and refillable ink converter.',
    price: 3490,
    discountPrice: 2790,
    category: catMap['Books & Stationery'],
    brand: 'Lamy',
    images: [
      'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: 'Fine Nib', color: 'Charcoal Black', stock: 20 },
      { size: 'Medium Nib', color: 'Savannah Green', stock: 15 },
    ],
    stock: 35,
    ratings: 4.8,
    numReviews: 78,
    isFeatured: false,
  },
  {
    name: 'The Psychology of Money Special Collector Hardcover',
    description:
      'Timeless lessons on wealth, greed, and happiness by Morgan Housel in an embossed linen-bound collector edition.',
    price: 799,
    discountPrice: 549,
    category: catMap['Books & Stationery'],
    brand: 'Jaico',
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: 'Hardcover', color: 'Gold Embossed', stock: 60 }],
    stock: 60,
    ratings: 4.9,
    numReviews: 310,
    isFeatured: false,
  },

  // Gaming & Toys
  {
    name: 'Sony PlayStation DualSense Wireless Controller (PS5 & PC)',
    description:
      'Immersive haptic feedback, dynamic adaptive triggers, built-in microphone array, and USB-C fast charging for PS5, PC, and Mac.',
    price: 6390,
    discountPrice: 5490,
    category: catMap['Gaming & Toys'],
    brand: 'Sony',
    images: [
      'https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: 'Standard', color: 'Cosmic Red', stock: 18 },
      { size: 'Standard', color: 'Glacier White', stock: 22 },
    ],
    stock: 40,
    ratings: 4.9,
    numReviews: 182,
    isFeatured: true,
  },
  {
    name: 'Razer BlackShark V2 Pro Wireless Esports Gaming Headset',
    description:
      'THX 7.1 Spatial Audio, TriForce Titanium 50mm drivers, detachable HyperClear supercardioid mic, and 70-hour battery life.',
    price: 17999,
    discountPrice: 13999,
    category: catMap['Gaming & Toys'],
    brand: 'Razer',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: 'Wireless', color: 'Stealth Black', stock: 16 }],
    stock: 16,
    ratings: 4.8,
    numReviews: 97,
    isFeatured: false,
  },
  {
    name: 'LEGO Technic Porsche 911 RSR Collectible Model Kit (1580 Pieces)',
    description:
      'Authentic replica featuring aerodynamic bodywork, visible six-cylinder boxer engine with moving pistons, and working differential.',
    price: 18999,
    discountPrice: 14999,
    category: catMap['Gaming & Toys'],
    brand: 'LEGO',
    images: [
      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '1580 Pieces', color: 'Racing White', stock: 12 }],
    stock: 12,
    ratings: 4.9,
    numReviews: 140,
    isFeatured: false,
  },
  {
    name: 'Handcrafted Rosewood Magnetic Tournament Chess Set',
    description:
      'Weighted Staunton chess pieces carved from Golden Rosewood and Boxwood with a foldable inlaid wooden storage board.',
    price: 3999,
    discountPrice: 2899,
    category: catMap['Gaming & Toys'],
    brand: 'RoyalCraft',
    images: [
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '14-Inch Board', color: 'Rosewood', stock: 28 }],
    stock: 28,
    ratings: 4.7,
    numReviews: 64,
    isFeatured: false,
  },

  // Groceries & Gourmet
  {
    name: 'Blue Tokai Single Estate 100% Arabica Roasted Coffee Beans (500g)',
    description:
      'Medium-dark roast specialty coffee notes of dark chocolate, roasted almond, and caramel sourced from Chikmagalur estates.',
    price: 1150,
    discountPrice: 899,
    category: catMap['Groceries & Gourmet'],
    brand: 'Blue Tokai',
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '500g', color: 'Whole Beans', stock: 40 },
      { size: '500g', color: 'French Press Grind', stock: 30 },
    ],
    stock: 70,
    ratings: 4.8,
    numReviews: 156,
    isFeatured: true,
  },
  {
    name: 'Himalayan Raw Multiflora Organic Wild Forest Honey (500g)',
    description:
      '100% pure NMR-tested unpasteurized wildflower honey rich in natural antioxidants, enzymes, and floral aroma.',
    price: 899,
    discountPrice: 649,
    category: catMap['Groceries & Gourmet'],
    brand: 'Organic India',
    images: [
      'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '500g Glass Jar', color: 'Wild Amber', stock: 55 }],
    stock: 55,
    ratings: 4.7,
    numReviews: 88,
    isFeatured: false,
  },
  {
    name: 'Lindt Excellence 85% Cocoa Swiss Dark Chocolate Bar Pack (Set of 4)',
    description:
      'Master Swiss chocolatier crafted extra-dark chocolate bars made from finest roasted cocoa beans with rich velvety finish.',
    price: 1599,
    discountPrice: 1249,
    category: catMap['Groceries & Gourmet'],
    brand: 'Lindt',
    images: [
      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '4 x 100g', color: '85% Dark', stock: 45 }],
    stock: 45,
    ratings: 4.9,
    numReviews: 112,
    isFeatured: false,
  },
  {
    name: 'California Jumbo Roasted Almonds & Pistachios Gift Hamper (1kg)',
    description:
      'Vacuum-packed crunchy California almonds and Iranian pistachios lightly dry-roasted with Himalayan pink salt.',
    price: 1899,
    discountPrice: 1399,
    category: catMap['Groceries & Gourmet'],
    brand: 'Happilo',
    images: [
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '1kg Tin', color: 'Assorted Dry Fruits', stock: 38 }],
    stock: 38,
    ratings: 4.6,
    numReviews: 73,
    isFeatured: false,
  },

  // Jewelry & Watches
  {
    name: 'Swarovski Angelic Solitaire Crystal Pendant Necklace',
    description:
      'Rhodium-plated chain necklace featuring a precision-cut clear round crystal framed in shimmering pavé crystals.',
    price: 9990,
    discountPrice: 7490,
    category: catMap['Jewelry & Watches'],
    brand: 'Swarovski',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '38cm Chain', color: 'Rhodium Silver', stock: 15 },
      { size: '38cm Chain', color: 'Rose Gold Tone', stock: 12 },
    ],
    stock: 27,
    ratings: 4.9,
    numReviews: 104,
    isFeatured: true,
  },
  {
    name: 'GIVA 925 Sterling Silver Zircon Solitaire Ring',
    description:
      'Hallmarked 925 sterling silver adjustable ring set with AAA+ Swiss cubic zirconia and anti-tarnish rhodium coating.',
    price: 2999,
    discountPrice: 1999,
    category: catMap['Jewelry & Watches'],
    brand: 'GIVA',
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: 'Adjustable', color: 'Sterling Silver', stock: 35 }],
    stock: 35,
    ratings: 4.7,
    numReviews: 89,
    isFeatured: false,
  },
  {
    name: 'Tissot PRX Powermatic 80 Stainless Steel Luxury Watch',
    description:
      'Swiss-made automatic timepiece with 80-hour power reserve, sapphire crystal glass, and integrated brushed steel bracelet.',
    price: 68500,
    discountPrice: 59900,
    category: catMap['Jewelry & Watches'],
    brand: 'Tissot',
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '40mm', color: 'Ice Blue Dial', stock: 8 },
      { size: '40mm', color: 'Navy Blue Dial', stock: 6 },
    ],
    stock: 14,
    ratings: 4.9,
    numReviews: 67,
    isFeatured: false,
  },
  {
    name: 'Freshwater Cultured Pearl & 18K Gold Plated Drop Earrings',
    description:
      'Hand-selected luminous freshwater pearls suspended from hypoallergenic 18K gold vermeil huggie hoops.',
    price: 4499,
    discountPrice: 3299,
    category: catMap['Jewelry & Watches'],
    brand: 'Tanishq Mia',
    images: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: 'One Size', color: '18K Gold & Pearl', stock: 24 }],
    stock: 24,
    ratings: 4.8,
    numReviews: 59,
    isFeatured: false,
  },

  // Bags & Luggage
  {
    name: 'Samsonite Octolite Hard-Shell Spinner Cabin Luggage (55cm)',
    description:
      'Impact-resistant polypropylene shell with 360-degree double spinner wheels, recessed TSA combination lock, and expandable capacity.',
    price: 16900,
    discountPrice: 12490,
    category: catMap['Bags & Luggage'],
    brand: 'Samsonite',
    images: [
      'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '55cm Cabin', color: 'Graphite Grey', stock: 14 },
      { size: '55cm Cabin', color: 'Ruby Red', stock: 10 },
    ],
    stock: 24,
    ratings: 4.8,
    numReviews: 118,
    isFeatured: true,
  },
  {
    name: 'Mokobara The Transit Backpack (16-Inch Laptop Compartment)',
    description:
      'Water-resistant vegan leather and nylon travel backpack featuring luggage strap, hidden passport pocket, and padded laptop sleeve.',
    price: 6999,
    discountPrice: 5299,
    category: catMap['Bags & Luggage'],
    brand: 'Mokobara',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '24L', color: 'Crypto Black', stock: 20 },
      { size: '24L', color: 'Sunray Yellow', stock: 12 },
    ],
    stock: 32,
    ratings: 4.8,
    numReviews: 143,
    isFeatured: false,
  },
  {
    name: 'Tommy Hilfiger Heritage Weekender Leather Trim Duffle Bag',
    description:
      'Spacious cabin-friendly canvas and leather weekender duffle with detachable shoulder strap and dedicated shoe compartment.',
    price: 8499,
    discountPrice: 6199,
    category: catMap['Bags & Luggage'],
    brand: 'Tommy Hilfiger',
    images: [
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [{ size: '45L', color: 'Navy & Tan', stock: 19 }],
    stock: 19,
    ratings: 4.7,
    numReviews: 52,
    isFeatured: false,
  },
  {
    name: 'Bellroy Classic Sling Crossbody Everyday Bag (7L)',
    description:
      'Recycled woven fabric sling bag with self-compressing gusset, magnetic strap clasp, and soft-lined sunglasses pouch.',
    price: 7999,
    discountPrice: 5999,
    category: catMap['Bags & Luggage'],
    brand: 'Bellroy',
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80',
    ],
    variants: [
      { size: '7L', color: 'Slate Grey', stock: 16 },
      { size: '7L', color: 'Bronze Olive', stock: 14 },
    ],
    stock: 30,
    ratings: 4.7,
    numReviews: 68,
    isFeatured: false,
  },
];

let ensuredExtraCategories = false;

async function ensureExtraCategoriesSeeded() {
  if (ensuredExtraCategories) return;
  try {
    const catMap = {};
    for (const catDef of EXTRA_CATEGORIES) {
      let doc = await Category.findOne({ name: catDef.name });
      if (!doc) {
        doc = await Category.create(catDef);
      }
      catMap[catDef.name] = doc._id;
    }

    const extraProducts = buildExtraProducts(catMap);
    for (const item of extraProducts) {
      if (!item.category) continue;
      const exists = await Product.findOne({ name: item.name });
      if (!exists) {
        await Product.create(item);
      }
    }
    ensuredExtraCategories = true;
  } catch {
    // Non-fatal; will retry on next request
  }
}

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    await ensureExtraCategoriesSeeded();

    const categories = await Category.find()
      .populate('parentCategory', 'name slug')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new category
 * @route   POST /api/categories
 * @access  Private (Admin / Manager)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, image, description, parentCategory } = req.body;

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      res.status(400);
      throw new Error('Category with this name already exists');
    }

    const category = await Category.create({
      name,
      image: image || '',
      description: description || '',
      parentCategory: parentCategory || null,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private (Admin / Manager)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    if (req.body.name !== undefined) category.name = req.body.name;
    if (req.body.image !== undefined) category.image = req.body.image;
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.body.parentCategory !== undefined) {
      category.parentCategory = req.body.parentCategory || null;
    }

    const updated = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error('Category not found');
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
