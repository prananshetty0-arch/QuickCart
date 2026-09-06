const User = require('../models/User');

// Must be used AFTER requireAuth so req.userId is already set
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Could not verify admin access.' });
  }
}

module.exports = requireAdmin;
