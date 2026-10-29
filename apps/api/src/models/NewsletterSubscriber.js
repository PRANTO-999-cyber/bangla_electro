import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed',
    index: true,
  },
  source: { type: String, default: 'storefront', maxlength: 80 },
  subscribedAt: { type: Date, default: Date.now },
  unsubscribedAt: { type: Date, default: null },
}, { timestamps: true });

newsletterSubscriberSchema.index({ status: 1, subscribedAt: -1, _id: -1 });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
