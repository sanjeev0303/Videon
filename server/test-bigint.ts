import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const invoices = await prisma.paymentInvoices.findMany({ take: 2 });
  console.log('invoices:', invoices);
  const mapped = invoices.map(inv => ({
    amount: Number(inv.amount_paid ?? inv.amount_due ?? 0)
  }));
  console.log('mapped:', mapped);
  console.log('stringified:', JSON.stringify(mapped));
}
run().catch(console.error).finally(() => prisma.$disconnect());
