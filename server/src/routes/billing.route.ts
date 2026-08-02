import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import { clerkAuthMiddleware } from '../middleware';

const router = Router();

router.get('/current', clerkAuthMiddleware, billingController.getCurrentPlan);
router.post('/checkout', clerkAuthMiddleware, billingController.createCheckoutSession);
router.get('/portal', clerkAuthMiddleware, billingController.createPortalSession);
router.get('/invoices', clerkAuthMiddleware, billingController.listInvoices);
router.post('/sync', clerkAuthMiddleware, billingController.syncCheckoutSession);
router.post('/webhook/stripe', billingController.handleStripeWebhook);

export { router as billingRouter };
