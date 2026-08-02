import { prisma } from '../utils';
import { PlanTier } from '../config/constant.config';
import type { Prisma } from '../../generated/prisma/client';

export class BillingRepository {
  async getPlanByUserId(userId: string) {
    return prisma.plan.findUnique({
      where: { user_id: userId },
    });
  }

  async getPlanByStripeCustomerId(stripeCustomerId: string) {
    return prisma.plan.findFirst({
      where: { stripe_customer_id: stripeCustomerId },
    });
  }

  async upsertPlan(
    userId: string,
    planTier: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ) {
    return prisma.plan.upsert({
      where: { user_id: userId },
      update: {
        name: planTier,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        name: planTier,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async getUsageByUserId(userId: string) {
    return prisma.usage.findUnique({
      where: { user_id: userId },
    });
  }

  async upsertUsage(
    userId: string,
    storageLimit: number,
    minutesStreamedLimit: number
  ) {
    return prisma.usage.upsert({
      where: { user_id: userId },
      update: {
        storage_limit: BigInt(storageLimit),
        minutes_streamed_limit: BigInt(minutesStreamedLimit),
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        storage_usage: 0n,
        storage_limit: BigInt(storageLimit),
        minutes_streamed: 0n,
        minutes_streamed_limit: BigInt(minutesStreamedLimit),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async getInvoices(userId: string) {
    return prisma.paymentInvoices.findMany({
      where: { user_id: userId },
      orderBy: [
        { period_end: 'desc' },
        { created_at: 'desc' },
      ],
      take: 20,
    });
  }

  async upsertInvoice(invoiceData: Prisma.PaymentInvoicesCreateInput) {
    return prisma.paymentInvoices.upsert({
      where: { stripe_invoice_id: invoiceData.stripe_invoice_id },
      update: {
        status: invoiceData.status,
        amount_due: invoiceData.amount_due,
        amount_paid: invoiceData.amount_paid,
        hosted_invoice_url: invoiceData.hosted_invoice_url,
        invoice_pdf: invoiceData.invoice_pdf,
        period_start: invoiceData.period_start,
        period_end: invoiceData.period_end,
        updated_at: new Date(),
      },
      create: {
        ...invoiceData,
      },
    });
  }
}
