const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: [
        'Fruits & Vegetables',
        'Dairy & Breakfast',
        'Snacks & Munchies',
        'Beverages',
        'Bakery',
        'Personal Care',
        'Household',
        'Atta, Rice & Dal',
      ],
    },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    unit: { type: String, required: true },
    icon: { type: String, default: '🛒' },
    stock: { type: Number, default: 100 },
    rating: { type: Number, default: 4.2, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.virtual('discountPercent').get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
