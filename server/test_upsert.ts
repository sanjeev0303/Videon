import { BillingService } from './src/services/billing.service';
import { prisma } from './src/utils';

async function test() {
  const billingService = new BillingService();
  const invoice = {
    id: 'in_12345',
    customer: 'cus_12345',
    metadata: { userId: 'user_12345' },
    status: 'paid',
    currency: 'usd',
    amount_due: 1000,
    amount_paid: 1000,
    hosted_invoice_url: 'http://example.com',
    invoice_pdf: 'http://example.com/pdf',
    period_start: Date.now() / 1000,
    period_end: Date.now() / 1000
  };
  await billingService.upsertInvoiceFromStripe(invoice);
  console.log("Done");
}
test().catch(console.error).finally(() => prisma.$disconnect());
