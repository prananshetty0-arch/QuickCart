const express = require('express');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();
router.use(requireAuth);

const FREE_DELIVERY_THRESHOLD = 199;
const DELIVERY_FEE = 25;

// POST /api/orders/checkout  { addressId, address(inline fallback), couponCode, paymentMethod }
router.post('/checkout', async (req, res) => {
  try {
    const { addressId, address, couponCode, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    // Resolve delivery address: either a saved address id or an inline object
    let deliveryAddress = null;
    if (addressId) {
      const user = await User.findById(req.userId);
      const saved = user.addresses.id(addressId);
      if (!saved) return res.status(400).json({ message: 'Selected address was not found.' });
      deliveryAddress = {
        label: saved.label,
        line: saved.line,
        city: saved.city,
        pincode: saved.pincode,
        phone: saved.phone,
      };
    } else if (address && address.line && address.city && address.pincode && address.phone) {
      deliveryAddress = address;
    } else {
      return res.status(400).json({ message: 'A delivery address is required.' });
    }

    const items = cart.items
      .filter((i) => i.product)
      .map((i) => ({
        product: i.product._id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        unit: i.product.unit,
        icon: i.product.icon,
      }));

    const subtotal = +items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

    let discount = 0;
    let appliedCode = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (coupon && subtotal >= coupon.minOrderValue) {
        discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        discount = Math.round(discount);
        appliedCode = coupon.code;
      }
    }

    const deliveryFee = subtotal - discount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const totalAmount = +(subtotal - discount + deliveryFee).toFixed(2);

    const order = await Order.create({
      user: req.userId,
      items,
      subtotal,
      discount,
      deliveryFee,
      totalAmount,
      couponCode: appliedCode,
      paymentMethod: paymentMethod || 'COD',
      address: deliveryAddress,
      status: 'Placed',
      statusHistory: [{ status: 'Placed', at: new Date() }],
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({ order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not place order.' });
  }
});

// GET /api/orders  (order history for the logged-in user)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: 'Invalid order id.' });
  }
});

// POST /api/orders/:id/cancel  (customer can cancel while still "Placed")
router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.userId });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Placed') {
      return res.status(400).json({ message: 'This order can no longer be cancelled.' });
    }
    order.status = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', at: new Date() });
    await order.save();
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Could not cancel order.' });
  }
});

// ---- Admin ----

// GET /api/orders/admin/all
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch orders.' });
  }
});

// PUT /api/orders/admin/:id/status  { status }
router.put('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Placed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = status;
    order.statusHistory.push({ status, at: new Date() });
    await order.save();
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Could not update order status.' });
  }
});

module.exports = router;
