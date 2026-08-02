import { prisma } from './src/utils';

async function main() {
  const plans = await prisma.plan.findMany();
  console.log("Plans:", plans);
  const invoices = await prisma.paymentInvoices.findMany();
  console.log("Invoices:", invoices);
}
main().catch(console.error).finally(() => prisma.$disconnect());
