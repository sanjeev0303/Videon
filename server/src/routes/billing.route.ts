import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import { clerkAuthMiddleware, responseCache } from '../middleware';

const router = Router();

router.get('/current', clerkAuthMiddleware, responseCache(120), billingController.getCurrentPlan);
router.post('/checkout', clerkAuthMiddleware, billingController.createCheckoutSession);
router.get('/portal', clerkAuthMiddleware, billingController.createPortalSession);
router.get('/invoices', clerkAuthMiddleware, responseCache(120), billingController.listInvoices);
router.post('/sync', clerkAuthMiddleware, billingController.syncCheckoutSession);
router.post('/webhook/stripe', billingController.handleStripeWebhook);

export { router as billingRouter };
