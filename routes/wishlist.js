const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/wishlist
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('wishlist');
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch wishlist.' });
  }
});

// POST /api/wishlist/:productId  toggle add
router.post('/:productId', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const idx = user.wishlist.findIndex((id) => id.toString() === req.params.productId);
    let added;
    if (idx === -1) {
      user.wishlist.push(req.params.productId);
      added = true;
    } else {
      user.wishlist.splice(idx, 1);
      added = false;
    }
    await user.save();
    res.json({ added, wishlistIds: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Could not update wishlist.' });
  }
});

module.exports = router;
