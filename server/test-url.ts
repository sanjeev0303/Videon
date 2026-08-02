import Stripe from 'stripe';
import { config } from 'dotenv';
config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2026-06-24.dahlia' as any });

async function run() {
  try {
    const frontendUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
    console.log('frontendUrl:', frontendUrl);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_PRO, quantity: 1 }],
      success_url: `${frontendUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing?canceled=1`,
    });
    console.log(session.url);
  } catch(err) {
    console.error(err);
  }
}
run();
