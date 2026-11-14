import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    // 1. Clear existing Categories and Products
    await Product.deleteMany();
    await Category.deleteMany();

    // 2. Ensure Demo Admin, Manager, and Customer Users exist
    const adminExists = await User.findOne({ email: 'admin@shopease.com' });
    if (!adminExists) {
      await User.create({
        name: 'ShopEase Admin',
        email: 'admin@shopease.com',
        password: 'password123',
        role: 'admin',
        phone: '+91 9876543210',
        isVerified: true,
      });
    }

    const managerExists = await User.findOne({ email: 'manager@shopease.com' });
    if (!managerExists) {
      await User.create({
        name: 'Store Manager',
        email: 'manager@shopease.com',
        password: 'password123',
        role: 'manager',
        phone: '+91 9876501234',
        isVerified: true,
      });
    }

    const customerExists = await User.findOne({ email: 'customer@shopease.com' });
    if (!customerExists) {
      await User.create({
        name: 'Nisha Customer',
        email: 'customer@shopease.com',
        password: 'password123',
        role: 'customer',
        phone: '+91 9123456780',
        isVerified: true,
        addresses: [
          {
            fullName: 'Nisha Customer',
            phone: '+91 9123456780',
            street: '42 MG Road, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
            isDefault: true,
          },
        ],
      });
    }

    // 3. Create Categories
    const categoriesData = [
      {
        name: 'Electronics',
        description: 'Smartphones, wireless headphones, laptops, cameras, and smartwatches',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Fashion',
        description: 'Trendy apparel, ethnic wear, jackets, hoodies, and everyday essentials',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Footwear',
        description: 'Running shoes, casual sneakers, boots, and formal footwear',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Accessories',
        description: 'Watches, backpacks, sunglasses, handbags, and leather wallets',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Home & Living',
        description: 'Minimalist decor, smart lighting, kitchen appliances, and coffee makers',
        image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Beauty & Care',
        description: 'Luxury skincare, serums, fragrances, and personal grooming essentials',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Sports & Fitness',
        description: 'Yoga mats, gym gear, smart hydration bottles, and outdoor equipment',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Books & Stationery',
        description: 'Bestselling books, luxury journals, fountain pens, and desk essentials',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Gaming & Toys',
        description: 'Next-gen gaming consoles, wireless controllers, RGB gear, and collectibles',
        image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Groceries & Gourmet',
        description: 'Artisanal roasted coffee, organic honey, premium dry fruits, and dark chocolates',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Jewelry & Watches',
        description: '925 sterling silver jewelry, minimal gold-plated necklaces, rings, and earrings',
        image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Bags & Luggage',
        description: 'Polycarbonate cabin trolley suitcases, travel duffles, and commuter bags',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      },
    ];

    const createdCategories = await Category.insertMany(categoriesData);
    const catMap = {};
    createdCategories.forEach((c) => {
      catMap[c.name] = c._id;
    });

    // 4. Create 58 Sample Products (8 Original + 50 New Products)
    const productsData = [
      // --- ORIGINAL 8 PRODUCTS ---
      {
        name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        description:
          'Industry-leading active noise cancellation with 8 microphones, 30-hour battery life, ultra-comfortable lightweight design, and multipoint Bluetooth connection.',
        price: 29990,
        discountPrice: 24990,
        category: catMap['Electronics'],
        brand: 'Sony',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Standard', color: 'Matte Black', stock: 15 },
          { size: 'Standard', color: 'Platinum Silver', stock: 10 },
        ],
        stock: 25,
        ratings: 4.8,
        numReviews: 124,
        isFeatured: true,
      },
      {
        name: 'Apple MacBook Air M3 (13-inch, 16GB RAM, 512GB SSD)',
        description:
          'Supercharged by the Apple M3 chip with an 8-core CPU and 10-core GPU, Liquid Retina display, MagSafe charging, and up to 18 hours of battery life.',
        price: 134900,
        discountPrice: 124900,
        category: catMap['Electronics'],
        brand: 'Apple',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '512GB', color: 'Midnight', stock: 8 },
          { size: '512GB', color: 'Starlight', stock: 6 },
        ],
        stock: 14,
        ratings: 4.9,
        numReviews: 89,
        isFeatured: true,
      },
      {
        name: 'Nike Air Zoom Pegasus 40 Running Shoes',
        description:
          'Responsive cushioning and breathable engineered mesh upper designed for daily road running, gym workouts, and all-day comfort.',
        price: 11895,
        discountPrice: 8999,
        category: catMap['Footwear'],
        brand: 'Nike',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Crimson Red', stock: 10 },
          { size: 'UK 8', color: 'Crimson Red', stock: 12 },
          { size: 'UK 9', color: 'Obsidian Black', stock: 8 },
        ],
        stock: 30,
        ratings: 4.6,
        numReviews: 64,
        isFeatured: true,
      },
      {
        name: 'Classic Indigo Denim Trucker Jacket',
        description:
          'Timeless 100% organic cotton denim jacket featuring brushed brass button closures, chest flap pockets, and a tailored modern fit.',
        price: 4499,
        discountPrice: 3199,
        category: catMap['Fashion'],
        brand: 'Levis',
        images: [
          'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Vintage Indigo', stock: 10 },
          { size: 'M', color: 'Vintage Indigo', stock: 15 },
          { size: 'L', color: 'Vintage Indigo', stock: 12 },
        ],
        stock: 37,
        ratings: 4.5,
        numReviews: 42,
        isFeatured: true,
      },
      {
        name: 'Fossil Gen 6 Hybrid Minimalist Chronograph Watch',
        description:
          'Stainless steel case with genuine leather strap, scratch-resistant mineral crystal glass, and 50m water resistance.',
        price: 14995,
        discountPrice: 10995,
        category: catMap['Accessories'],
        brand: 'Fossil',
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '44mm', color: 'Tan Leather', stock: 18 },
          { size: '44mm', color: 'Matte Black', stock: 9 },
        ],
        stock: 27,
        ratings: 4.7,
        numReviews: 53,
        isFeatured: false,
      },
      {
        name: 'Nordic Ceramic Pour-Over Coffee Maker Set',
        description:
          'Handcrafted matte ceramic dripper and borosilicate glass carafe for brewing rich, aromatic specialty coffee at home.',
        price: 2999,
        discountPrice: 2199,
        category: catMap['Home & Living'],
        brand: 'BrewCraft',
        images: [
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '600ml', color: 'Charcoal Black', stock: 22 }],
        stock: 22,
        ratings: 4.4,
        numReviews: 29,
        isFeatured: false,
      },
      {
        name: 'Adidas Ultraboost Light Everyday Sneakers',
        description:
          '30% lighter BOOST material combined with a Primeknit+ upper for supreme energy return and breathable support.',
        price: 15999,
        discountPrice: 11999,
        category: catMap['Footwear'],
        brand: 'Adidas',
        images: [
          'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Cloud White', stock: 8 },
          { size: 'UK 8', color: 'Cloud White', stock: 14 },
          { size: 'UK 9', color: 'Core Black', stock: 10 },
        ],
        stock: 32,
        ratings: 4.7,
        numReviews: 77,
        isFeatured: true,
      },
      {
        name: 'Urban Waterproof Commuter Laptop Backpack (24L)',
        description:
          'Fits up to 16-inch laptops with padded microfiber sleeve, hidden anti-theft passport pocket, and luggage pass-through strap.',
        price: 3999,
        discountPrice: 2799,
        category: catMap['Accessories'],
        brand: 'Mokobara',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '24L', color: 'Slate Grey', stock: 20 },
          { size: '24L', color: 'Olive Green', stock: 15 },
        ],
        stock: 35,
        ratings: 4.6,
        numReviews: 48,
        isFeatured: false,
      },

      // --- 50 NEW PRODUCTS ---
      // 1-12: Electronics (12 new items)
      {
        name: 'Apple iPhone 16 Pro (256GB, Desert Titanium)',
        description:
          'Powered by the A18 Pro chip with 48MP Fusion camera system, 5x Telephoto zoom, Camera Control button, and aerospace-grade titanium design.',
        price: 129900,
        discountPrice: 121900,
        category: catMap['Electronics'],
        brand: 'Apple',
        images: [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '256GB', color: 'Desert Titanium', stock: 12 },
          { size: '256GB', color: 'Natural Titanium', stock: 8 },
        ],
        stock: 20,
        ratings: 4.9,
        numReviews: 215,
        isFeatured: true,
      },
      {
        name: 'Samsung Galaxy S24 Ultra 5G (12GB RAM, 256GB)',
        description:
          'Built-in S Pen, Galaxy AI features, 200MP quad telephoto camera system, Snapdragon 8 Gen 3 processor, and Corning Gorilla Armor display.',
        price: 129999,
        discountPrice: 109999,
        category: catMap['Electronics'],
        brand: 'Samsung',
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '256GB', color: 'Titanium Gray', stock: 10 },
          { size: '256GB', color: 'Titanium Black', stock: 9 },
        ],
        stock: 19,
        ratings: 4.8,
        numReviews: 178,
        isFeatured: true,
      },
      {
        name: 'Apple iPad Air M2 (11-inch, Wi-Fi, 128GB)',
        description:
          'Stunning 11-inch Liquid Retina display, M2 chip performance, landscape 12MP Ultra Wide front camera, and Apple Pencil Pro support.',
        price: 59900,
        discountPrice: 54900,
        category: catMap['Electronics'],
        brand: 'Apple',
        images: [
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '128GB', color: 'Space Grey', stock: 14 },
          { size: '128GB', color: 'Blue', stock: 10 },
        ],
        stock: 24,
        ratings: 4.8,
        numReviews: 94,
        isFeatured: false,
      },
      {
        name: 'Logitech MX Master 3S Wireless Performance Mouse',
        description:
          '8000 DPI optical sensor that tracks on glass, Quiet Click buttons, MagSpeed electromagnetic scrolling, and ergonomic sculpted silhouette.',
        price: 10995,
        discountPrice: 8499,
        category: catMap['Electronics'],
        brand: 'Logitech',
        images: [
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Standard', color: 'Graphite', stock: 25 },
          { size: 'Standard', color: 'Pale Grey', stock: 15 },
        ],
        stock: 40,
        ratings: 4.9,
        numReviews: 310,
        isFeatured: false,
      },
      {
        name: 'Keychron K2 Pro QMK/VIA Wireless Mechanical Keyboard',
        description:
          '75% compact layout hot-swappable mechanical keyboard with PBT double-shot keycaps, RGB backlight, and Mac/Windows dual compatibility.',
        price: 11499,
        discountPrice: 9299,
        category: catMap['Electronics'],
        brand: 'Keychron',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Brown Switch', color: 'Carbon Black', stock: 18 },
          { size: 'Red Switch', color: 'Carbon Black', stock: 12 },
        ],
        stock: 30,
        ratings: 4.7,
        numReviews: 88,
        isFeatured: false,
      },
      {
        name: 'Marshall Emberton II Portable Bluetooth Speaker',
        description:
          'Rich, clear, and loud 360-degree True Stereophonic sound with 30+ hours of portable playtime and IP67 dust and water resistance.',
        price: 17999,
        discountPrice: 13999,
        category: catMap['Electronics'],
        brand: 'Marshall',
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Standard', color: 'Black & Brass', stock: 14 },
          { size: 'Standard', color: 'Cream', stock: 8 },
        ],
        stock: 22,
        ratings: 4.8,
        numReviews: 142,
        isFeatured: true,
      },
      {
        name: 'Sony Alpha ZV-E10 Mirrorless Vlog Camera (16-50mm Lens)',
        description:
          '24.2MP APS-C Exmor CMOS sensor, real-time Eye AF, 4K movie recording, vari-angle LCD screen, and directional 3-capsule mic.',
        price: 69990,
        discountPrice: 58990,
        category: catMap['Electronics'],
        brand: 'Sony',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: 'Kit Lens', color: 'Matte Black', stock: 9 }],
        stock: 9,
        ratings: 4.7,
        numReviews: 67,
        isFeatured: false,
      },
      {
        name: 'Apple Watch Series 10 GPS (46mm Jet Black Aluminium)',
        description:
          'Thinnest Apple Watch ever with wide-angle OLED display, ECG app, blood oxygen sensor, sleep apnea notifications, and fast charging.',
        price: 49900,
        discountPrice: 45900,
        category: catMap['Electronics'],
        brand: 'Apple',
        images: [
          'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '46mm', color: 'Jet Black', stock: 15 },
          { size: '42mm', color: 'Rose Gold', stock: 12 },
        ],
        stock: 27,
        ratings: 4.8,
        numReviews: 119,
        isFeatured: false,
      },
      {
        name: 'LG UltraGear 27-inch QHD 180Hz IPS Gaming Monitor',
        description:
          '2560x1440 Nano IPS display with 1ms (GtG) response time, NVIDIA G-SYNC Compatible, HDR400, and height-adjustable ergonomic stand.',
        price: 28999,
        discountPrice: 21499,
        category: catMap['Electronics'],
        brand: 'LG',
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '27-inch', color: 'Matte Black', stock: 16 }],
        stock: 16,
        ratings: 4.6,
        numReviews: 73,
        isFeatured: false,
      },
      {
        name: 'Nothing Ear (a) Hi-Res Active Noise Cancelling Earbuds',
        description:
          '45dB smart active noise cancellation, 11mm dynamic driver, LDAC Hi-Res Wireless Audio certification, and up to 42.5 hours total listening time.',
        price: 9999,
        discountPrice: 6999,
        category: catMap['Electronics'],
        brand: 'Nothing',
        images: [
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Standard', color: 'Yellow', stock: 18 },
          { size: 'Standard', color: 'White', stock: 22 },
        ],
        stock: 40,
        ratings: 4.5,
        numReviews: 108,
        isFeatured: false,
      },
      {
        name: 'SanDisk Extreme Portable 1TB USB-C NVMe SSD',
        description:
          'Blazing-fast 1050MB/s read and 1000MB/s write speeds with IP65 water/dust resistance and 256-bit AES hardware encryption.',
        price: 13999,
        discountPrice: 8999,
        category: catMap['Electronics'],
        brand: 'SanDisk',
        images: [
          'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '1TB', color: 'Monterey Black', stock: 30 },
          { size: '2TB', color: 'Sky Blue', stock: 12 },
        ],
        stock: 42,
        ratings: 4.8,
        numReviews: 195,
        isFeatured: false,
      },
      {
        name: 'Anker Prime 20000mAh 200W GaN Fast Power Bank',
        description:
          'High-capacity 200W total output portable charger with smart digital OLED display, dual USB-C ports, and airline-safe battery cells.',
        price: 12999,
        discountPrice: 9499,
        category: catMap['Electronics'],
        brand: 'Anker',
        images: [
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '20000mAh', color: 'Space Black', stock: 26 }],
        stock: 26,
        ratings: 4.7,
        numReviews: 64,
        isFeatured: false,
      },

      // 13-22: Fashion (10 new items)
      {
        name: 'Ralph Lauren Pure Linen Button-Down Oxford Shirt',
        description:
          'Breathable 100% European flax linen shirt tailored for a relaxed yet refined silhouette, ideal for summer days and smart-casual evenings.',
        price: 8999,
        discountPrice: 6499,
        category: catMap['Fashion'],
        brand: 'Ralph Lauren',
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Sky Blue', stock: 14 },
          { size: 'L', color: 'Crisp White', stock: 16 },
          { size: 'XL', color: 'Sky Blue', stock: 10 },
        ],
        stock: 40,
        ratings: 4.7,
        numReviews: 58,
        isFeatured: false,
      },
      {
        name: 'Zara Oversized Heavyweight French Terry Hoodie',
        description:
          '420 GSM combed cotton French terry hoodie featuring dropped shoulders, kangaroo pocket, and ribbed cuffs for street-ready comfort.',
        price: 3990,
        discountPrice: 2790,
        category: catMap['Fashion'],
        brand: 'Zara',
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Washed Charcoal', stock: 15 },
          { size: 'M', color: 'Sage Green', stock: 20 },
          { size: 'L', color: 'Washed Charcoal', stock: 15 },
        ],
        stock: 50,
        ratings: 4.6,
        numReviews: 91,
        isFeatured: false,
      },
      {
        name: 'H&M Floral Pleated Georgette Midi Dress',
        description:
          'Flowing ankle-grazing midi dress crafted from airy pleated georgette with a cinched waist tie and delicate botanical print.',
        price: 3499,
        discountPrice: 2299,
        category: catMap['Fashion'],
        brand: 'H&M',
        images: [
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'XS', color: 'Blush Floral', stock: 10 },
          { size: 'S', color: 'Blush Floral', stock: 18 },
          { size: 'M', color: 'Blush Floral', stock: 14 },
        ],
        stock: 42,
        ratings: 4.5,
        numReviews: 74,
        isFeatured: true,
      },
      {
        name: 'Fabindia Handloom Silk Blend Festive Kurta Set',
        description:
          'Artisanal woven Chanderi silk-cotton kurta paired with matching tapered trousers and zari-trimmed organza dupatta.',
        price: 6499,
        discountPrice: 4899,
        category: catMap['Fashion'],
        brand: 'Fabindia',
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Emerald Green', stock: 12 },
          { size: 'M', color: 'Royal Maroon', stock: 15 },
          { size: 'L', color: 'Emerald Green', stock: 10 },
        ],
        stock: 37,
        ratings: 4.8,
        numReviews: 112,
        isFeatured: true,
      },
      {
        name: 'Uniqlo Ultra Light Down Packable Quilted Jacket',
        description:
          'Featherlight water-repellent winter layer filled with premium 750+ fill power down that folds neatly into its compact travel pouch.',
        price: 5990,
        discountPrice: 4490,
        category: catMap['Fashion'],
        brand: 'Uniqlo',
        images: [
          'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Navy Blue', stock: 14 },
          { size: 'L', color: 'Olive Drab', stock: 16 },
        ],
        stock: 30,
        ratings: 4.8,
        numReviews: 83,
        isFeatured: false,
      },
      {
        name: 'Tommy Hilfiger Stretch Chino Slim Fit Trousers',
        description:
          'Peached organic cotton twill chinos with 2% elastane stretch for effortless office-to-weekend versatility.',
        price: 4999,
        discountPrice: 3499,
        category: catMap['Fashion'],
        brand: 'Tommy Hilfiger',
        images: [
          'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '30', color: 'Desert Khaki', stock: 12 },
          { size: '32', color: 'Desert Khaki', stock: 18 },
          { size: '34', color: 'Midnight Navy', stock: 15 },
        ],
        stock: 45,
        ratings: 4.5,
        numReviews: 49,
        isFeatured: false,
      },
      {
        name: 'Mango Tailored Double-Breasted Wool Blend Blazer',
        description:
          'Structured peak-lapel blazer in an Italian wool-blend weave with tortoise-shell buttons and full satin lining.',
        price: 7990,
        discountPrice: 5990,
        category: catMap['Fashion'],
        brand: 'Mango',
        images: [
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Camel Beige', stock: 9 },
          { size: 'M', color: 'Camel Beige', stock: 12 },
          { size: 'L', color: 'Jet Black', stock: 8 },
        ],
        stock: 29,
        ratings: 4.7,
        numReviews: 61,
        isFeatured: false,
      },
      {
        name: 'Calvin Klein Supima Cotton Crew Neck T-Shirt (Pack of 2)',
        description:
          'Ultra-soft long-staple Supima cotton crew neck tees with minimal tonal chest embroidery and tagless collar comfort.',
        price: 3499,
        discountPrice: 2499,
        category: catMap['Fashion'],
        brand: 'Calvin Klein',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'M', color: 'Black & White', stock: 25 },
          { size: 'L', color: 'Black & White', stock: 25 },
        ],
        stock: 50,
        ratings: 4.6,
        numReviews: 105,
        isFeatured: false,
      },
      {
        name: 'Marks & Spencer Merino Wool Ribbed Turtleneck Sweater',
        description:
          'Luxuriously fine 100% Australian extra-fine merino wool knitwear with natural temperature regulation and anti-pilling finish.',
        price: 4499,
        discountPrice: 3299,
        category: catMap['Fashion'],
        brand: 'Marks & Spencer',
        images: [
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Oatmeal Cream', stock: 11 },
          { size: 'M', color: 'Burgundy Wine', stock: 14 },
        ],
        stock: 25,
        ratings: 4.7,
        numReviews: 38,
        isFeatured: false,
      },
      {
        name: 'Puma DryCELL High-Waist Training Leggings',
        description:
          'Four-way stretch compression fabric with moisture-wicking dryCELL technology, flatlock seams, and hidden side phone pocket.',
        price: 2999,
        discountPrice: 1899,
        category: catMap['Fashion'],
        brand: 'Puma',
        images: [
          'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'S', color: 'Carbon Black', stock: 20 },
          { size: 'M', color: 'Plum Berry', stock: 18 },
        ],
        stock: 38,
        ratings: 4.5,
        numReviews: 67,
        isFeatured: false,
      },

      // 23-30: Footwear (8 new items)
      {
        name: 'New Balance 574 Core Suede Heritage Sneakers',
        description:
          'Iconic retro silhouette combining premium pigskin suede and mesh uppers with ENCAP midsole cushioning for all-day street wear.',
        price: 9999,
        discountPrice: 7499,
        category: catMap['Footwear'],
        brand: 'New Balance',
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 8', color: 'Nimbus Cloud Grey', stock: 14 },
          { size: 'UK 9', color: 'Nimbus Cloud Grey', stock: 12 },
        ],
        stock: 26,
        ratings: 4.8,
        numReviews: 118,
        isFeatured: true,
      },
      {
        name: 'Converse Chuck 70 Vintage Canvas High Top',
        description:
          'Upgraded heavyweight 12oz organic canvas, winged tongue stitching, glossy egret midsole, and OrthoLite cushioned insole.',
        price: 6499,
        discountPrice: 4999,
        category: catMap['Footwear'],
        brand: 'Converse',
        images: [
          'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Classic Black', stock: 15 },
          { size: 'UK 8', color: 'Parchment Cream', stock: 15 },
          { size: 'UK 9', color: 'Classic Black', stock: 10 },
        ],
        stock: 40,
        ratings: 4.7,
        numReviews: 154,
        isFeatured: false,
      },
      {
        name: 'Clarks Desert Chelsea Handcrafted Suede Boots',
        description:
          'Supple Steads suede upper with elastic side gussets and signature natural plantation crepe sole for timeless British style.',
        price: 11999,
        discountPrice: 8999,
        category: catMap['Footwear'],
        brand: 'Clarks',
        images: [
          'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 8', color: 'Sand Suede', stock: 10 },
          { size: 'UK 9', color: 'Dark Brown Suede', stock: 12 },
        ],
        stock: 22,
        ratings: 4.6,
        numReviews: 52,
        isFeatured: false,
      },
      {
        name: 'ASICS Gel-Kayano 30 Stability Marathon Running Shoes',
        description:
          '4D GUIDANCE SYSTEM adaptive stability paired with FF BLAST PLUS ECO cushioning and PureGEL rearfoot shock absorption.',
        price: 15999,
        discountPrice: 12499,
        category: catMap['Footwear'],
        brand: 'ASICS',
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 8', color: 'Electric Lime', stock: 11 },
          { size: 'UK 9', color: 'Midnight Blue', stock: 9 },
        ],
        stock: 20,
        ratings: 4.9,
        numReviews: 97,
        isFeatured: false,
      },
      {
        name: 'Birkenstock Arizona Birko-Flor Two-Strap Footbed Sandals',
        description:
          'Anatomically shaped cork-latex footbed lined with breathable suede that molds to the natural contours of your foot.',
        price: 7990,
        discountPrice: 6490,
        category: catMap['Footwear'],
        brand: 'Birkenstock',
        images: [
          'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 6', color: 'Mocha Brown', stock: 14 },
          { size: 'UK 7', color: 'Mocha Brown', stock: 16 },
          { size: 'UK 8', color: 'Onyx Black', stock: 12 },
        ],
        stock: 42,
        ratings: 4.8,
        numReviews: 132,
        isFeatured: false,
      },
      {
        name: 'Puma Palermo Leather Retro Terrace Sneakers',
        description:
          '80s stadium heritage silhouette revived with T-toe suede overlays, foil-printed branding, and classic gum rubber outsole.',
        price: 6999,
        discountPrice: 5299,
        category: catMap['Footwear'],
        brand: 'Puma',
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Cobalt Blue & White', stock: 12 },
          { size: 'UK 8', color: 'Forest Green & Gum', stock: 15 },
        ],
        stock: 27,
        ratings: 4.6,
        numReviews: 68,
        isFeatured: false,
      },
      {
        name: 'Hush Puppies Full-Grain Leather Penny Loafers',
        description:
          'Hand-stitched burnished leather dress loafers with Bounce memory foam footbed and flexible slip-resistant outsole.',
        price: 5999,
        discountPrice: 4299,
        category: catMap['Footwear'],
        brand: 'Hush Puppies',
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 8', color: 'Cognac Tan', stock: 14 },
          { size: 'UK 9', color: 'Espresso Black', stock: 12 },
        ],
        stock: 26,
        ratings: 4.5,
        numReviews: 44,
        isFeatured: false,
      },
      {
        name: 'Vans Old Skool Suede & Canvas Skate Shoes',
        description:
          'Classic low-top skate shoe with iconic side stripe, reinforced toe caps, padded collars, and signature rubber waffle outsole.',
        price: 5499,
        discountPrice: 3999,
        category: catMap['Footwear'],
        brand: 'Vans',
        images: [
          'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'UK 7', color: 'Black/White', stock: 18 },
          { size: 'UK 8', color: 'Black/White', stock: 20 },
        ],
        stock: 38,
        ratings: 4.7,
        numReviews: 121,
        isFeatured: false,
      },

      // 31-38: Accessories (8 new items)
      {
        name: 'Ray-Ban Clubmaster Classic Polarized Sunglasses',
        description:
          'Retro 50s browline frame in acetate and gold-tone metal with G-15 green polarized crystal lenses offering 100% UV400 protection.',
        price: 12490,
        discountPrice: 9490,
        category: catMap['Accessories'],
        brand: 'Ray-Ban',
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '51mm', color: 'Tortoise & Gold', stock: 14 },
          { size: '51mm', color: 'Ebony Black & Gold', stock: 12 },
        ],
        stock: 26,
        ratings: 4.8,
        numReviews: 146,
        isFeatured: true,
      },
      {
        name: 'Casio Vintage A168WG Gold Digital Stainless Watch',
        description:
          'Iconic retro digital timepiece with electro-luminescent backlight, 1/100-second stopwatch, daily alarm, and adjustable clasp.',
        price: 5495,
        discountPrice: 4195,
        category: catMap['Accessories'],
        brand: 'Casio',
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '36mm', color: 'Vintage Gold', stock: 22 },
          { size: '36mm', color: 'Brushed Silver', stock: 18 },
        ],
        stock: 40,
        ratings: 4.8,
        numReviews: 230,
        isFeatured: false,
      },
      {
        name: 'Hidesign Vegetable-Tanned Leather RFID Bifold Wallet',
        description:
          'Handcrafted full-grain ranch leather wallet with built-in RFID blocking lining, 8 card slots, and twin currency compartments.',
        price: 2795,
        discountPrice: 1995,
        category: catMap['Accessories'],
        brand: 'Hidesign',
        images: [
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Standard', color: 'Saddle Tan', stock: 25 },
          { size: 'Standard', color: 'Mahogany Brown', stock: 20 },
        ],
        stock: 45,
        ratings: 4.6,
        numReviews: 87,
        isFeatured: false,
      },
      {
        name: 'Michael Kors Saffiano Leather Structured Tote Bag',
        description:
          'Scratch-resistant crossgrain Saffiano leather work tote featuring a padded 14-inch laptop zip compartment and gold-tone hardware.',
        price: 18999,
        discountPrice: 13999,
        category: catMap['Accessories'],
        brand: 'Michael Kors',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Large', color: 'Luggage Brown', stock: 8 },
          { size: 'Large', color: 'Optic Black', stock: 10 },
        ],
        stock: 18,
        ratings: 4.8,
        numReviews: 76,
        isFeatured: false,
      },
      {
        name: 'Mokobara The Cabin Polycarbonate Hard-Shell Luggage (40L)',
        description:
          'German Makrolon polycarbonate shell with whisper-quiet Japanese Hinomoto 360-degree spinner wheels and TSA combination lock.',
        price: 11999,
        discountPrice: 7999,
        category: catMap['Accessories'],
        brand: 'Mokobara',
        images: [
          'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: 'Cabin 40L', color: 'Cosmic Teal', stock: 12 },
          { size: 'Cabin 40L', color: 'Sunset Yellow', stock: 9 },
        ],
        stock: 21,
        ratings: 4.9,
        numReviews: 112,
        isFeatured: false,
      },
      {
        name: 'Seiko 5 Sports Automatic Mechanical Diver Watch',
        description:
          '24-jewel Caliber 4R36 automatic movement with 41-hour power reserve, exhibition case back, day-date display, and 100m water resistance.',
        price: 25000,
        discountPrice: 20999,
        category: catMap['Accessories'],
        brand: 'Seiko',
        images: [
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '42.5mm', color: 'Pepsi Bezel Navy', stock: 9 },
          { size: '42.5mm', color: 'Emerald Dial', stock: 7 },
        ],
        stock: 16,
        ratings: 4.9,
        numReviews: 93,
        isFeatured: false,
      },
      {
        name: 'Tommy Hilfiger Reversible Italian Leather Dress Belt',
        description:
          'Two-in-one full-grain leather belt with a brushed gunmetal swivel buckle that transitions seamlessly from black to cognac brown.',
        price: 3299,
        discountPrice: 2299,
        category: catMap['Accessories'],
        brand: 'Tommy Hilfiger',
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '34', color: 'Black / Brown', stock: 20 },
          { size: '36', color: 'Black / Brown', stock: 20 },
        ],
        stock: 40,
        ratings: 4.5,
        numReviews: 55,
        isFeatured: false,
      },
      {
        name: 'Swarovski Angelic Round Rhodium-Plated Pendant Necklace',
        description:
          'Precision-cut clear Swarovski zirconia halo crystal necklace suspended on a delicate rhodium-plated chain with lobster clasp.',
        price: 8990,
        discountPrice: 6990,
        category: catMap['Accessories'],
        brand: 'Swarovski',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '38cm', color: 'Crystal Silver', stock: 16 }],
        stock: 16,
        ratings: 4.8,
        numReviews: 69,
        isFeatured: false,
      },

      // 39-44: Home & Living (6 new items)
      {
        name: 'Philips Hue White & Color Ambiance Smart LED Starter Kit',
        description:
          '16 million colors smart lighting system with Hue Bridge, Alexa/Google Home voice control, and customizable circadian schedules.',
        price: 10999,
        discountPrice: 7999,
        category: catMap['Home & Living'],
        brand: 'Philips',
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '3 Bulbs + Bridge', color: 'Multicolor RGB', stock: 18 }],
        stock: 18,
        ratings: 4.7,
        numReviews: 84,
        isFeatured: false,
      },
      {
        name: 'Dyson V12 Detect Slim Cordless Vacuum Cleaner',
        description:
          'Illumination cleaner head reveals invisible dust on hard floors, piezo sensor counts dust particles, and 60-minute fade-free suction.',
        price: 58900,
        discountPrice: 49900,
        category: catMap['Home & Living'],
        brand: 'Dyson',
        images: [
          'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: 'Standard', color: 'Yellow / Nickel', stock: 10 }],
        stock: 10,
        ratings: 4.9,
        numReviews: 129,
        isFeatured: true,
      },
      {
        name: 'Nespresso Essenza Mini 19-Bar Espresso Coffee Machine',
        description:
          'Ultra-compact single-serve espresso maker with 19-bar high-pressure pump, 25-second heat-up time, and programmable cup sizes.',
        price: 16999,
        discountPrice: 12999,
        category: catMap['Home & Living'],
        brand: 'Nespresso',
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '600ml Tank', color: 'Ruby Red', stock: 12 },
          { size: '600ml Tank', color: 'Piano Black', stock: 14 },
        ],
        stock: 26,
        ratings: 4.8,
        numReviews: 91,
        isFeatured: false,
      },
      {
        name: 'Wakefit Orthopedic Memory Foam Queen Bed Mattress (8-inch)',
        description:
          '7-zone pressure-relieving memory foam mattress with breathable spun-knitted removable zipper cover and 10-year manufacturer warranty.',
        price: 17999,
        discountPrice: 12499,
        category: catMap['Home & Living'],
        brand: 'Wakefit',
        images: [
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '78x60x8 inch', color: 'White & Grey', stock: 15 }],
        stock: 15,
        ratings: 4.7,
        numReviews: 204,
        isFeatured: false,
      },
      {
        name: 'IKEA FADO Minimalist Frosted Glass Table Lamp',
        description:
          'Soft ambient globe table lamp crafted from mouth-blown frosted glass, creating cozy warm mood lighting for bedrooms and reading corners.',
        price: 2499,
        discountPrice: 1799,
        category: catMap['Home & Living'],
        brand: 'IKEA',
        images: [
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '25cm', color: 'Warm White', stock: 30 }],
        stock: 30,
        ratings: 4.6,
        numReviews: 63,
        isFeatured: false,
      },
      {
        name: 'Le Creuset Enameled Cast Iron Dutch Oven (4.2L)',
        description:
          'Heirloom French enameled cast iron cocotte with superior heat retention for slow braising, artisan bread baking, and stovetop simmering.',
        price: 28990,
        discountPrice: 22990,
        category: catMap['Home & Living'],
        brand: 'Le Creuset',
        images: [
          'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '24cm / 4.2L', color: 'Flame Orange', stock: 8 },
          { size: '24cm / 4.2L', color: 'Marseille Blue', stock: 7 },
        ],
        stock: 15,
        ratings: 4.9,
        numReviews: 78,
        isFeatured: false,
      },

      // 45-47: Beauty & Care (3 new items)
      {
        name: 'The Ordinary Niacinamide 10% + Zinc 1% Pore Refining Serum',
        description:
          'High-strength vitamin and mineral blemish formula that visibly brightens skin tone, minimizes pores, and balances excess sebum.',
        price: 1150,
        discountPrice: 850,
        category: catMap['Beauty & Care'],
        brand: 'The Ordinary',
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '60ml', color: 'Clear', stock: 50 }],
        stock: 50,
        ratings: 4.8,
        numReviews: 340,
        isFeatured: false,
      },
      {
        name: 'Dior Sauvage Eau de Parfum Spray for Men (100ml)',
        description:
          'Sensual and mysterious fragrance combining juicy Calabrian bergamot with spicy Sichuan pepper and smoky Papua New Guinean vanilla.',
        price: 11500,
        discountPrice: 9800,
        category: catMap['Beauty & Care'],
        brand: 'Dior',
        images: [
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '100ml', color: 'Midnight Bottle', stock: 18 }],
        stock: 18,
        ratings: 4.9,
        numReviews: 188,
        isFeatured: true,
      },
      {
        name: 'Philips OneBlade Pro 360 Face & Body Hybrid Trimmer',
        description:
          '360-degree flexing stainless steel blade with 14-length precision comb, wet & dry waterproof design, and 90-minute Li-ion battery.',
        price: 4999,
        discountPrice: 3699,
        category: catMap['Beauty & Care'],
        brand: 'Philips',
        images: [
          'https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: 'Pro Kit', color: 'Lime & Charcoal', stock: 28 }],
        stock: 28,
        ratings: 4.7,
        numReviews: 114,
        isFeatured: false,
      },

      // 48-50: Sports & Fitness (3 new items)
      {
        name: 'Manduka PROlite Non-Slip Eco Yoga Mat (4.7mm)',
        description:
          'High-density closed-cell cushioned yoga mat engineered for zero moisture absorption, superior joint support, and lifetime durability.',
        price: 7499,
        discountPrice: 5499,
        category: catMap['Sports & Fitness'],
        brand: 'Manduka',
        images: [
          'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '180x61cm', color: 'Midnight Navy', stock: 16 },
          { size: '180x61cm', color: 'Sage Olive', stock: 14 },
        ],
        stock: 30,
        ratings: 4.8,
        numReviews: 71,
        isFeatured: false,
      },
      {
        name: 'Stanley Quencher H2.0 FlowState Insulated Tumbler (1.18L)',
        description:
          '90% recycled stainless steel vacuum-insulated tumbler that keeps drinks ice-cold for 48 hours with 3-position rotating lid and reusable straw.',
        price: 4499,
        discountPrice: 3499,
        category: catMap['Sports & Fitness'],
        brand: 'Stanley',
        images: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [
          { size: '40 oz / 1.18L', color: 'Rose Quartz', stock: 20 },
          { size: '40 oz / 1.18L', color: 'Frost White', stock: 20 },
        ],
        stock: 40,
        ratings: 4.8,
        numReviews: 163,
        isFeatured: false,
      },
      {
        name: 'Bowflex SelectTech 552 Adjustable Dumbbell Set (2.5kg - 24kg)',
        description:
          'Replaces 15 sets of weights with a turn of a dial, switching effortlessly from 2.5 kg right up to 24 kg for full-body home strength training.',
        price: 29999,
        discountPrice: 22999,
        category: catMap['Sports & Fitness'],
        brand: 'Bowflex',
        images: [
          'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
        ],
        variants: [{ size: '24kg Pair', color: 'Black & Red', stock: 10 }],
        stock: 10,
        ratings: 4.9,
        numReviews: 85,
        isFeatured: false,
      },

      // --- 5 NEW CATEGORIES PRODUCTS (20 NEW ITEMS) ---
      // Books & Stationery (4 items)
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

      // Gaming & Toys (4 items)
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

      // Groceries & Gourmet (4 items)
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

      // Jewelry & Watches (4 items)
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
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
        ].map(() => 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&auto=format&fit=crop&q=80'),
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

      // Bags & Luggage (4 items)
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

    for (const item of productsData) {
      await Product.create(item);
    }

    // 5. Seed Sample Discount Coupons
    await Coupon.deleteMany();
    await Coupon.insertMany([
      {
        code: 'WELCOME10',
        discountType: 'percent',
        value: 10,
        minOrderValue: 999,
        maxDiscount: 1500,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 500,
      },
      {
        code: 'FLAT500',
        discountType: 'flat',
        value: 500,
        minOrderValue: 4999,
        expiryDate: new Date('2028-12-31'),
        usageLimit: 200,
      },
    ]);

    console.log('====================================================');
    console.log('Database Seeded Successfully!');
    console.log('Demo Admin:    admin@shopease.com    | password123');
    console.log('Demo Manager:  manager@shopease.com  | password123');
    console.log('Demo Customer: customer@shopease.com | password123');
    console.log('Coupons:       WELCOME10 (10% off)   | FLAT500 (₹500 off)');
    console.log(`Created ${createdCategories.length} Categories & ${productsData.length} Products`);
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('Seeder Error:', error);
    process.exit(1);
  }
};

seedDatabase();
