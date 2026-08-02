import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { getPlan, getUsage, PLAN_DEFAULTS } from './upload.middleware';
import { PlanTier } from '../config';

export const playerGuard = async (
  request: Request & { user?: { id: string } },
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = request.user?.id;

    if (!userId) {
      return next(new AppError('Unauthorized!', 401));
    }

    const plan = await getPlan(userId);
    const planDefaults = PLAN_DEFAULTS[plan.name] ?? PLAN_DEFAULTS[PlanTier.FREE];

    const usage = await getUsage(userId, planDefaults);

    const effectiveMinutesLimit =
      usage.minutesStreamedLimit > 0
        ? usage.minutesStreamedLimit
        : planDefaults.minutesLimit;

    const streamedSeconds = Number(usage.minutesStreamed ?? 0);
    const limitSeconds = effectiveMinutesLimit * 60;

    if (limitSeconds > 0 && streamedSeconds >= limitSeconds) {
      return next(
        new AppError(
          'You have reached your streaming minutes limit for your current plan',
          403,
        ),
      );
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
