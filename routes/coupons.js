const express = require('express');
const Coupon = require('../models/Coupon');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/coupons  -> list active, non-expired coupons (public, so users can see offers)
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
    }).select('code description type value minOrderValue maxDiscount');
    res.json({ coupons });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch coupons.' });
  }
});

// POST /api/coupons/validate  { code, subtotal }
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ message: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Invalid or expired coupon code.' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired.' });
    }
    if (subtotal < coupon.minOrderValue) {
      return res
        .status(400)
        .json({ message: `Add items worth ₹${coupon.minOrderValue - subtotal} more to use this coupon.` });
    }

    let discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.round(discount);

    res.json({
      code: coupon.code,
      description: coupon.description,
      discount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not validate coupon.' });
  }
});

module.exports = router;
