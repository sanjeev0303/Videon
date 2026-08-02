export enum PlayerEventType {
    PLAY = "play",
    PAUSE = "pause",
    HEARTBEAT = "heartbeat",
    SEEK = "seek",
    ENDED = "ended"
}

export interface AnalyticsEventDto {
    event: PlayerEventType;
    currentTime: number;
    previousTime?: number;
    token: string;
    geo?: string;
    isUnique?: boolean
}
