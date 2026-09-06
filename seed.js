// Run with: npm run seed
// Wipes products/coupons and creates a demo admin account.

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickcart';

const raw = [
  // Fruits & Vegetables
  { name: 'Fresh Banana', description: 'Ripe yellow bananas', category: 'Fruits & Vegetables', price: 45, mrp: 55, unit: '6 pcs', icon: '🍌', stock: 150, isFeatured: true },
  { name: 'Alphonso Mango', description: 'Sweet Alphonso mangoes', category: 'Fruits & Vegetables', price: 120, mrp: 150, unit: '4 pcs', icon: '🥭', stock: 80, isFeatured: true },
  { name: 'Red Apple', description: 'Crisp Shimla apples', category: 'Fruits & Vegetables', price: 180, mrp: 210, unit: '1 kg', icon: '🍎', stock: 100 },
  { name: 'Onion', description: 'Fresh farm onions', category: 'Fruits & Vegetables', price: 35, mrp: 40, unit: '1 kg', icon: '🧅', stock: 200 },
  { name: 'Tomato', description: 'Juicy red tomatoes', category: 'Fruits & Vegetables', price: 30, mrp: 38, unit: '1 kg', icon: '🍅', stock: 200 },
  { name: 'Potato', description: 'Farm fresh potatoes', category: 'Fruits & Vegetables', price: 28, mrp: 32, unit: '1 kg', icon: '🥔', stock: 200 },
  { name: 'Green Capsicum', description: 'Crunchy green capsicum', category: 'Fruits & Vegetables', price: 50, mrp: 60, unit: '500 g', icon: '🫑', stock: 90 },
  { name: 'Carrot', description: 'Fresh orange carrots', category: 'Fruits & Vegetables', price: 40, mrp: 48, unit: '500 g', icon: '🥕', stock: 90 },

  // Dairy & Breakfast
  { name: 'Toned Milk', description: 'Fresh toned milk pouch', category: 'Dairy & Breakfast', price: 32, mrp: 34, unit: '500 ml', icon: '🥛', stock: 120, isFeatured: true },
  { name: 'Farm Eggs', description: 'Protein rich white eggs', category: 'Dairy & Breakfast', price: 72, mrp: 84, unit: '6 pcs', icon: '🥚', stock: 100 },
  { name: 'Paneer', description: 'Soft and fresh cottage cheese', category: 'Dairy & Breakfast', price: 90, mrp: 100, unit: '200 g', icon: '🧀', stock: 60 },
  { name: 'Curd', description: 'Thick and creamy curd', category: 'Dairy & Breakfast', price: 30, mrp: 35, unit: '400 g', icon: '🥣', stock: 80 },
  { name: 'Butter', description: 'Salted table butter', category: 'Dairy & Breakfast', price: 54, mrp: 58, unit: '100 g', icon: '🧈', stock: 70 },
  { name: 'Corn Flakes', description: 'Crunchy breakfast cereal', category: 'Dairy & Breakfast', price: 210, mrp: 250, unit: '475 g', icon: '🥣', stock: 50 },

  // Snacks & Munchies
  { name: 'Potato Chips', description: 'Classic salted potato chips', category: 'Snacks & Munchies', price: 20, mrp: 20, unit: '52 g', icon: '🍟', stock: 150 },
  { name: 'Chocolate Cookies', description: 'Crunchy choco-chip cookies', category: 'Snacks & Munchies', price: 30, mrp: 35, unit: '150 g', icon: '🍪', stock: 100, isFeatured: true },
  { name: 'Namkeen Mixture', description: 'Spicy Indian snack mix', category: 'Snacks & Munchies', price: 45, mrp: 50, unit: '200 g', icon: '🥨', stock: 90 },
  { name: 'Popcorn', description: 'Ready to eat butter popcorn', category: 'Snacks & Munchies', price: 40, mrp: 45, unit: '90 g', icon: '🍿', stock: 90 },
  { name: 'Peanut Butter Cups', description: 'Chocolate peanut butter cups', category: 'Snacks & Munchies', price: 99, mrp: 120, unit: '150 g', icon: '🍫', stock: 60 },

  // Beverages
  { name: 'Cola Soft Drink', description: 'Chilled cola soft drink', category: 'Beverages', price: 40, mrp: 45, unit: '750 ml', icon: '🥤', stock: 100 },
  { name: 'Orange Juice', description: '100% real orange juice', category: 'Beverages', price: 99, mrp: 110, unit: '1 L', icon: '🧃', stock: 70, isFeatured: true },
  { name: 'Instant Coffee', description: 'Rich aroma instant coffee', category: 'Beverages', price: 145, mrp: 165, unit: '100 g', icon: '☕', stock: 60 },
  { name: 'Green Tea', description: 'Antioxidant rich green tea bags', category: 'Beverages', price: 130, mrp: 150, unit: '25 bags', icon: '🍵', stock: 60 },
  { name: 'Mineral Water', description: 'Packaged drinking water', category: 'Beverages', price: 20, mrp: 20, unit: '1 L', icon: '💧', stock: 200 },

  // Bakery
  { name: 'Brown Bread', description: 'Soft whole wheat bread', category: 'Bakery', price: 45, mrp: 50, unit: '400 g', icon: '🍞', stock: 80 },
  { name: 'Chocolate Muffin', description: 'Freshly baked choco muffin', category: 'Bakery', price: 35, mrp: 40, unit: '1 pc', icon: '🧁', stock: 60 },
  { name: 'Croissant', description: 'Buttery, flaky croissant', category: 'Bakery', price: 55, mrp: 65, unit: '1 pc', icon: '🥐', stock: 50 },
  { name: 'Donut', description: 'Glazed sugar donut', category: 'Bakery', price: 40, mrp: 45, unit: '1 pc', icon: '🍩', stock: 60 },

  // Personal Care
  { name: 'Face Wash', description: 'Gentle daily face wash', category: 'Personal Care', price: 149, mrp: 175, unit: '100 ml', icon: '🧴', stock: 50 },
  { name: 'Toothpaste', description: 'Cavity protection toothpaste', category: 'Personal Care', price: 55, mrp: 65, unit: '100 g', icon: '🪥', stock: 90 },
  { name: 'Shampoo', description: 'Nourishing hair shampoo', category: 'Personal Care', price: 189, mrp: 220, unit: '340 ml', icon: '🧴', stock: 50 },
  { name: 'Hand Sanitizer', description: '99.9% germ protection', category: 'Personal Care', price: 60, mrp: 70, unit: '200 ml', icon: '🧴', stock: 70 },

  // Household
  { name: 'Dishwash Liquid', description: 'Removes tough grease easily', category: 'Household', price: 99, mrp: 115, unit: '500 ml', icon: '🧽', stock: 60 },
  { name: 'Floor Cleaner', description: 'Disinfectant floor cleaner', category: 'Household', price: 175, mrp: 199, unit: '1 L', icon: '🧴', stock: 50 },
  { name: 'Garbage Bags', description: 'Medium size garbage bags', category: 'Household', price: 85, mrp: 99, unit: '30 pcs', icon: '🗑️', stock: 70 },
  { name: 'Tissue Paper', description: 'Soft facial tissue box', category: 'Household', price: 65, mrp: 75, unit: '100 pulls', icon: '🧻', stock: 70 },

  // Atta, Rice & Dal
  { name: 'Wheat Atta', description: 'Whole wheat flour', category: 'Atta, Rice & Dal', price: 260, mrp: 290, unit: '5 kg', icon: '🌾', stock: 60 },
  { name: 'Basmati Rice', description: 'Long grain basmati rice', category: 'Atta, Rice & Dal', price: 320, mrp: 360, unit: '5 kg', icon: '🍚', stock: 50, isFeatured: true },
  { name: 'Toor Dal', description: 'Premium quality toor dal', category: 'Atta, Rice & Dal', price: 150, mrp: 170, unit: '1 kg', icon: '🫘', stock: 60 },
  { name: 'Cooking Oil', description: 'Refined sunflower oil', category: 'Atta, Rice & Dal', price: 145, mrp: 160, unit: '1 L', icon: '🛢️', stock: 60 },
];

// Deterministic pseudo-random rating so re-seeding gives consistent-looking data
function ratingFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 1000;
  const rating = 3.6 + (hash % 14) / 10; // 3.6 - 5.0
  const numReviews = 20 + (hash % 480); // 20 - 500
  return { rating: +rating.toFixed(1), numReviews };
}

const products = raw.map((p) => ({ ...p, ...ratingFor(p.name) }));

const coupons = [
  { code: 'WELCOME50', description: 'Flat ₹50 off on your first order', type: 'flat', value: 50, minOrderValue: 200 },
  { code: 'SAVE10', description: '10% off on orders above ₹300', type: 'percent', value: 10, minOrderValue: 300, maxDiscount: 100 },
  { code: 'BIGCART20', description: '20% off on orders above ₹800', type: 'percent', value: 20, minOrderValue: 800, maxDiscount: 250 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB, seeding data...');

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log(`✅ Inserted ${products.length} products.`);

    await Coupon.deleteMany({});
    await Coupon.insertMany(coupons);
    console.log(`✅ Inserted ${coupons.length} coupons.`);

    const adminEmail = 'admin@quickcart.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'QuickCart Admin',
        email: adminEmail,
        password: await bcrypt.hash('admin123', 10),
        isAdmin: true,
      });
      console.log('✅ Created demo admin account -> admin@quickcart.com / admin123');
    } else {
      console.log('ℹ️  Admin account already exists, skipped.');
    }

    console.log('🎉 Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
