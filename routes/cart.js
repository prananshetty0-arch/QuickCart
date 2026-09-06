const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

function buildCartResponse(cart) {
  const items = cart.items
    .filter((i) => i.product)
    .map((i) => ({
      product: i.product,
      quantity: i.quantity,
      subtotal: +(i.product.price * i.quantity).toFixed(2),
    }));
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = +items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);
  return { items, totalItems, totalAmount };
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    await cart.populate('items.product');
    res.json(buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch cart.' });
  }
});

// POST /api/cart/add  { productId, quantity }
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const cart = await getOrCreateCart(req.userId);
    const existingItem = cart.items.find((i) => i.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add item to cart.' });
  }
});

// PUT /api/cart/update  { productId, quantity }  (quantity 0 removes it)
router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await getOrCreateCart(req.userId);

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    } else {
      const item = cart.items.find((i) => i.product.toString() === productId);
      if (!item) return res.status(404).json({ message: 'Item not in cart.' });
      item.quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate('items.product');
    res.json(buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update cart.' });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    await cart.save();
    await cart.populate('items.product');
    res.json(buildCartResponse(cart));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not remove item.' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    cart.items = [];
    await cart.save();
    res.json({ items: [], totalItems: 0, totalAmount: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Could not clear cart.' });
  }
});

module.exports = router;
