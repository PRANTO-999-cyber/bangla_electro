import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, min: 0, required: true },
  minOrderValue: { type: Number, min: 0, default: 0 },
  maxDiscount: { type: Number, min: 0 },
  applicableProducts: [mongoose.Schema.Types.ObjectId],
  applicableCategories: [mongoose.Schema.Types.ObjectId],
  usageLimit: { type: Number, min: 0 },
  perUserLimit: { type: Number, min: 0 },
  startsAt: Date,
  endsAt: Date,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
export default mongoose.model('Coupon', schema);