import { z } from 'zod';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { fail, ok } from '../utils/response.js';

const subscriptionSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();

export async function subscribeToNewsletter(req, res) {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 'একটি সঠিক ইমেইল ঠিকানা দিন।', 400, parsed.error.issues.map((issue) => issue.message));
  }

  try {
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email: parsed.data.email },
      {
        $set: { status: 'subscribed', unsubscribedAt: null, source: 'storefront' },
        $setOnInsert: { email: parsed.data.email, subscribedAt: new Date() },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).select('_id status');

    return ok(res, { subscribed: subscriber.status === 'subscribed' }, 'সাবস্ক্রিপশনের জন্য ধন্যবাদ।', 200);
  } catch (error) {
    if (error?.code === 11000) {
      return ok(res, { subscribed: true }, 'আপনি ইতিমধ্যে তালিকায় যুক্ত আছেন।');
    }
    throw error;
  }
}

export async function listNewsletterSubscribers(req, res) {
  const requestedPage = Number.parseInt(req.query.page, 10);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100000) : 1;
  const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 25;
  const filter = req.query.status === 'unsubscribed' ? { status: 'unsubscribed' } : { status: 'subscribed' };
  const [items, total] = await Promise.all([
    NewsletterSubscriber.find(filter).sort({ subscribedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).select('email status source subscribedAt unsubscribedAt createdAt').lean(),
    NewsletterSubscriber.countDocuments(filter),
  ]);
  return ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
