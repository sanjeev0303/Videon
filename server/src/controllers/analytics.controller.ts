import { Request, Response } from 'express';
import { analyticsService } from '../services';

export const handleAnalyticsEvent = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await analyticsService.handleEvent(req.body, ip, userAgent as string);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message?.includes('Invalid')) {
      res.status(401).json({ error: error.message });
    } else {
      console.error('Analytics event error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await analyticsService.getAnalytics(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMainAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const range = req.query.range as string;
    const result = await analyticsService.getMainAnalytics(userId, range);
    res.status(200).json(result);
  } catch (error) {
    console.error('getMainAnalytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
