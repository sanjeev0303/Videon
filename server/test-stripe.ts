import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
async function main() {
  const sessions = await stripe.checkout.sessions.list({ limit: 3 });
  for (const s of sessions.data) {
    console.log(`Session: ${s.id}`);
    console.log(` Status: ${s.status}, Payment Status: ${s.payment_status}`);
    console.log(` Metadata:`, s.metadata);
    console.log(` Client Ref: ${s.client_reference_id}`);
    console.log(` Invoice: ${s.invoice}`);
  }
}
main().catch(console.error);
