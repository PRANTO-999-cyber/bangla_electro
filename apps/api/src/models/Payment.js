import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['sslcommerz'], required: true },
  transactionId: { type: String, required: true, unique: true, sparse: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['BDT'], default: 'BDT' },
  status: { type: String, enum: ['pending', 'verifying', 'paid', 'failed', 'cancelled', 'expired'], default: 'pending', index: true },
  sessionKey: String,
  validationId: String,
  metadata: mongoose.Schema.Types.Mixed,
  paidAt: Date,
}, { timestamps: true });

export default mongoose.model('Payment', schema);