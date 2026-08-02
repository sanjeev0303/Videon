import { Request, Response, NextFunction } from 'express';
import { PlayerService } from '../services/player.service';

export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  public loadVideo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoTrackingId } = req.params;
      const data = await this.playerService.streamVideo(videoTrackingId as string);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const data = await this.playerService.getPlayerSettings(userId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  public updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const data = await this.playerService.updatePlayerSettings(userId, req.body);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}
