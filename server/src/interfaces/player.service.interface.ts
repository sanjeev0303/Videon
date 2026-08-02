export interface IPlayerService {
  streamVideo(videoTrackingId: string): Promise<any>;
  getPlayerSettings(userId: string): Promise<any>;
  updatePlayerSettings(userId: string, input: any): Promise<any>;
}
