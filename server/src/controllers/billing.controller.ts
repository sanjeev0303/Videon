import type { Request, Response, NextFunction } from 'express';
import { BillingService } from '../services/billing.service';
import { createSuccessResponse } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

const billingService = new BillingService();

export const getCurrentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const result = await billingService.getCurrentPlan(userId);
    res.status(200).json(createSuccessResponse('Current plan retrieved', result));
  } catch (error) {
    next(error);
  }
};

export const createCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const { planTier } = req.body;
    const result = await billingService.createCheckoutSession(userId, planTier);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json(createSuccessResponse('Checkout session created', result));
  } catch (error) {
    next(error);
  }
};

export const syncCheckoutSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const { sessionId } = req.body;
    if (!sessionId) {
      throw new AppError('Session ID is required', 400);
    }
    const result = await billingService.syncCheckoutSession(sessionId, userId);
    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json(createSuccessResponse('Session synced successfully', result));
  } catch (error) {
    next(error);
  }
};

export const createPortalSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const result = await billingService.createPortalSession(userId);
    res.status(200).json(createSuccessResponse('Portal session created', result));
  } catch (error) {
    next(error);
  }
};

export const listInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const result = await billingService.listInvoices(userId);
    res.status(200).json(createSuccessResponse('Invoices retrieved', result));
  } catch (error) {
    next(error);
  }
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = (req as any).rawBody;
    const result = await billingService.handleStripeWebhook(rawBody, signature);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
