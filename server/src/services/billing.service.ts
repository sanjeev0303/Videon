import { createClerkClient } from '@clerk/backend';
import Stripe from 'stripe';
import { PlanTier, normalizePlanTier, planRedisKey, usageRedisKey, hardLockRedisKey, PLAN_REDIS_TTL_SEC } from '../config/constant.config';
import { redisClient } from '../utils';
import { BillingRepository } from '../repositories/billing.repository';
import { planCache, usageCache, PLAN_DEFAULTS } from '../middleware/upload.middleware';

export class BillingService {
  private stripe: Stripe;
  private billingRepository: BillingRepository;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY as string;
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2026-06-24.dahlia' as any,
    });
    this.billingRepository = new BillingRepository();
  }

  private getFrontendUrl() {
    const url = process.env.FRONTEND_URL || 'http://localhost:3000';
    return url.trim();
  }

  private getPriceIdForPlan(planTier: PlanTier) {
    if (planTier === PlanTier.STARTER) {
      return process.env.STRIPE_PRICE_STARTER as string;
    }
    if (planTier === PlanTier.PRO) {
      return process.env.STRIPE_PRICE_PRO as string;
    }
    if (planTier === PlanTier.BUSINESS) {
      return process.env.STRIPE_PRICE_BUSINESS as string;
    }
    throw new Error('Invalid plan');
  }

  async getCurrentPlan(userId: string) {
    const record = await this.billingRepository.getPlanByUserId(userId);
    const name = normalizePlanTier(record?.name);
    let nextBillingDate = null;

    if (record?.stripe_subscription_id) {
      try {
        const sub = await this.stripe.subscriptions.retrieve(record.stripe_subscription_id) as any;
        nextBillingDate = new Date(sub.current_period_end * 1000).toISOString();
      } catch (err) {
        console.error('Failed to retrieve stripe subscription', err);
      }
    }
    
    return { plan: name, nextBillingDate };
  }

  private async getClerkEmail(userId: string) {
    try {
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const u: any = await clerkClient.users.getUser(userId);
      const primaryId = u?.primaryEmailAddressId;
      const primary = u?.emailAddresses?.find((e: any) => e?.id === primaryId);
      return (
        primary?.emailAddress ??
        u?.emailAddresses?.[0]?.emailAddress ??
        undefined
      );
    } catch {
      return undefined;
    }
  }

  private async ensureStripeCustomer(userId: string) {
    const email = await this.getClerkEmail(userId);
    if (!email) {
      throw new Error('Missing user email');
    }

    const record = await this.billingRepository.getPlanByUserId(userId);

    if (record?.stripe_customer_id) {
      try {
        const existingCustomer = await this.stripe.customers.retrieve(
          record.stripe_customer_id,
        );
        const existingEmail = (existingCustomer as any)?.email;
        if (!existingEmail || existingEmail !== email) {
          await this.stripe.customers.update(record.stripe_customer_id, {
            email,
          });
        }
      } catch {}

      return {
        customerId: record.stripe_customer_id,
        currentPlan: normalizePlanTier(record.name),
      };
    }

    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    const currentPlan = normalizePlanTier(record?.name);

    await this.billingRepository.upsertPlan(userId, currentPlan, customer.id, record?.stripe_subscription_id || undefined);

    return { customerId: customer.id, currentPlan };
  }

  async createPortalSession(userId: string) {
    const frontendUrl = this.getFrontendUrl();
    const { customerId } = await this.ensureStripeCustomer(userId);

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async createCheckoutSession(userId: string, rawPlan: string) {
    const planTier = normalizePlanTier(rawPlan);

    if (planTier === PlanTier.FREE) {
      return { error: 'Free plan does not require checkout' };
    }

    const priceId = this.getPriceIdForPlan(planTier);
    const frontendUrl = this.getFrontendUrl();
    const { customerId } = await this.ensureStripeCustomer(userId);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: {
        userId,
        planTier,
      },
      subscription_data: {
        metadata: {
          userId,
          planTier,
        },
      },
      success_url: `${frontendUrl}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/billing?canceled=1`,
    });

    return { url: session.url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.userId || session.client_reference_id;
      const planTier = normalizePlanTier(session.metadata?.planTier);
      const stripeCustomerId = session.customer as string | undefined;
      const stripeSubscriptionId = session.subscription as string | undefined;

      if (userId) {
        await this.applyPlanAndLimits(userId, planTier, {
          stripeCustomerId,
          stripeSubscriptionId,
        });
      }
      return { received: true };
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as any;
      await this.upsertInvoiceFromStripe(invoice);
      return { received: true };
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any;
      const userId = sub.metadata?.userId;

      if (userId) {
        await this.applyPlanAndLimits(userId, PlanTier.FREE, {
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
        });
      }
      return { received: true };
    }

    return { received: true };
  }

  async syncCheckoutSession(sessionId: string, userId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status === 'paid' || session.status === 'complete') {
        const sessionUserId = session.metadata?.userId || session.client_reference_id;
        
        // Ensure the session belongs to the requesting user
        if (sessionUserId !== userId) {
          return { error: 'Session does not belong to user' };
        }

        const planTier = normalizePlanTier(session.metadata?.planTier);
        const stripeCustomerId = session.customer as string | undefined;
        const stripeSubscriptionId = session.subscription as string | undefined;

        await this.applyPlanAndLimits(userId, planTier, {
          stripeCustomerId,
          stripeSubscriptionId,
        });

        if (session.invoice) {
          try {
            const invoice = await this.stripe.invoices.retrieve(session.invoice as string);
            await this.upsertInvoiceFromStripe(invoice);
          } catch (err) {
            console.error('Failed to sync invoice during checkout session:', err);
          }
        } else if (session.subscription) {
          try {
            const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
            if (subscription.latest_invoice) {
              const invoiceId = typeof subscription.latest_invoice === 'string' 
                ? subscription.latest_invoice 
                : subscription.latest_invoice.id;
              const invoice = await this.stripe.invoices.retrieve(invoiceId);
              await this.upsertInvoiceFromStripe(invoice);
            }
          } catch (err) {
            console.error('Failed to sync invoice from subscription:', err);
          }
        }

        return { success: true, plan: planTier };
      }
      
      return { success: false, message: 'Session not completed yet' };
    } catch (error) {
      console.error('Error syncing checkout session:', error);
      return { error: 'Failed to sync checkout session' };
    }
  }


  private async applyPlanAndLimits(
    userId: string,
    planTier: PlanTier,
    stripe?: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    },
  ) {
    const limits = PLAN_DEFAULTS[planTier] ?? PLAN_DEFAULTS[PlanTier.FREE];

    await this.billingRepository.upsertPlan(userId, planTier, stripe?.stripeCustomerId, stripe?.stripeSubscriptionId);

    const existingUsage = await this.billingRepository.getUsageByUserId(userId);

    await this.billingRepository.upsertUsage(userId, limits.storageLimit, limits.minutesLimit);

    await redisClient.del(hardLockRedisKey(userId));

    const planRKey = planRedisKey(userId);
    await redisClient.hset(planRKey, { name: planTier });
    await redisClient.expire(planRKey, PLAN_REDIS_TTL_SEC);

    const usageRKey = usageRedisKey(userId);
    const storageUsage = existingUsage?.storage_usage ?? 0;
    const minutesStreamedSeconds = existingUsage?.minutes_streamed ?? 0;
    
    await redisClient.hset(usageRKey, {
      storageUsage: String(storageUsage),
      storageLimit: String(limits.storageLimit),
      minutesStreamed: String(minutesStreamedSeconds),
      minutesStreamedLimit: String(limits.minutesLimit),
    });
    await redisClient.expire(usageRKey, PLAN_REDIS_TTL_SEC);

    planCache.set(`plan:${userId}`, { name: planTier });
    usageCache.set(`usage:${userId}`, {
      storageUsage: Number(storageUsage),
      storageLimit: Number(limits.storageLimit),
      minutesStreamed: Number(minutesStreamedSeconds),
      minutesStreamedLimit: Number(limits.minutesLimit),
    });
  }

  async listInvoices(userId: string) {
    const invoices = await this.billingRepository.getInvoices(userId);
    const planRow = await this.billingRepository.getPlanByUserId(userId);
    const planName = normalizePlanTier(planRow?.name);
    
    return {
      invoices: invoices.map((inv: any) => ({
        date: inv.period_end ?? inv.created_at,
        plan: planName,
        status: inv.status ?? null,
        currency: inv.currency ?? null,
        amount: Number(inv.amount_paid ?? inv.amount_due ?? 0),
        hosted_invoice_url: inv.hosted_invoice_url ?? null,
        invoice_pdf: inv.invoice_pdf ?? null,
      })),
    };
  }

  async upsertInvoiceFromStripe(invoice: any) {
    const stripeInvoiceId = invoice?.id;
    const stripeCustomerId = invoice?.customer;
    if (!stripeInvoiceId || !stripeCustomerId) return;

    const userIdFromMetadata = invoice?.metadata?.userId as string | undefined;
    let userId = userIdFromMetadata;
    
    if (!userId) {
      const record = await this.billingRepository.getPlanByStripeCustomerId(stripeCustomerId);
      userId = record?.user_id;
    }
    
    if (!userId) return;

    const periodStart = invoice?.period_start
      ? new Date(invoice.period_start * 1000)
      : undefined;
    const periodEnd = invoice?.period_end
      ? new Date(invoice.period_end * 1000)
      : undefined;

    await this.billingRepository.upsertInvoice({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: invoice?.subscription ?? null,
      stripe_invoice_id: stripeInvoiceId,
      status: invoice?.status ?? null,
      currency: invoice?.currency ?? null,
      amount_due: invoice?.amount_due != null ? BigInt(invoice.amount_due) : null,
      amount_paid: invoice?.amount_paid != null ? BigInt(invoice.amount_paid) : null,
      hosted_invoice_url: invoice?.hosted_invoice_url ?? null,
      invoice_pdf: invoice?.invoice_pdf ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      updated_at: new Date(),
    });
  }
}
