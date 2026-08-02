import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { media } from '@oneminutecloud/media-convert';
import { appConfig } from '../config';
import { AppError } from '../middleware/error.middleware';
import { timestampsToChaptersVtt } from '../utils/vtt.transformer';
import type { IPlayerService, IPlayerRepository } from '../interfaces';
import { LRUCache } from 'lru-cache';

export type PlayerSettings = {
  primaryColor?: string;
  fontFamily?: string;
  controls?: string[];
  captions?: {
    fontColor?: string;
    backgroundColor?: string;
    fontSize?: number;
  };
  playButton?: {
    preset?: 'classic' | 'minimal' | 'block';
    customIcon?: string;
  };
};

export const DEFAULT_PLAYER_SETTINGS: Required<PlayerSettings> = {
  primaryColor: '#e11d48',
  fontFamily: 'Rubik',
  controls: [
    'Play / Pause',
    '10s Backward',
    '10s Forward',
    'Full Screen',
    'Captions',
    'Volume',
    'Mute',
    'Progress',
    'Settings',
    'AirPlay',
    'Chromecast',
    'Current Time',
    'Duration',
  ],
  captions: {
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    fontSize: 18,
  },
  playButton: {
    preset: 'classic',
    customIcon: '',
  },
};

const settingsCache = new LRUCache<string, PlayerSettings>({
  max: 100_000,
  ttl: 5 * 60 * 1000,
});

function isHexColor(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function sanitizeFontFamily(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) return undefined;
  if (!/^[a-zA-Z0-9 ,'"-]+$/.test(trimmed)) return undefined;
  return trimmed;
}

function sanitizeSettings(input: any): PlayerSettings {
  const out: PlayerSettings = {};
  if (isHexColor(input?.primaryColor)) out.primaryColor = input.primaryColor;
  const fontFamily = sanitizeFontFamily(input?.fontFamily);
  if (fontFamily) out.fontFamily = fontFamily;

  if (Array.isArray(input?.controls)) {
    const validControls = input.controls.filter((c: any) => typeof c === 'string');
    if (validControls.length > 0) {
      out.controls = validControls;
    } else {
      out.controls = [];
    }
  }

  if (input?.captions && typeof input.captions === 'object') {
    const captions: PlayerSettings['captions'] = {};
    if (isHexColor(input.captions.fontColor)) {
      captions.fontColor = input.captions.fontColor;
    }
    if (isHexColor(input.captions.backgroundColor)) {
      captions.backgroundColor = input.captions.backgroundColor;
    }
    const fontSize = Number(input.captions.fontSize);
    if (Number.isFinite(fontSize)) {
      const clamped = Math.max(8, Math.min(64, Math.round(fontSize)));
      captions.fontSize = clamped;
    }
    if (Object.keys(captions).length > 0) out.captions = captions;
  }

  if (input?.playButton && typeof input.playButton === 'object') {
    const pb: NonNullable<PlayerSettings['playButton']> = {};
    if (['classic', 'minimal', 'block'].includes(input.playButton.preset)) {
      pb.preset = input.playButton.preset;
    }
    if (typeof input.playButton.customIcon === 'string') {
      pb.customIcon = input.playButton.customIcon;
    }
    if (Object.keys(pb).length > 0) out.playButton = pb;
  }

  return out;
}

function mergeSettings(base: PlayerSettings, override: PlayerSettings): PlayerSettings {
  return {
    ...base,
    ...override,
    captions: {
      ...(base.captions ?? {}),
      ...(override.captions ?? {}),
    },
    playButton: {
      ...(base.playButton ?? {}),
      ...(override.playButton ?? {}),
    },
  };
}

export class PlayerService implements IPlayerService {
  constructor(private readonly playerRepository: IPlayerRepository) {}

  async streamVideo(videoTrackingId: string) {
    if (!videoTrackingId) {
      throw new AppError('VideoTrackingId is required!', 400);
    }

    const videoMetaData = await this.playerRepository.getVideoMetadataByTrackingId(videoTrackingId);

    if (!videoMetaData) {
      throw new AppError(`Video not found with trackingId: ${videoTrackingId}`, 404);
    }

    const sessionId = crypto.randomUUID();

    const analyticsToken = jwt.sign(
      {
        purpose: 'playback_analytics',
        sessionId,
        videoId: videoMetaData.id,
        videoTrackingId: videoMetaData.videoTrackingId,
      },
      appConfig.analyticsJwtSecret,
      { expiresIn: '1h' }
    );

    const timestamps = videoMetaData.timestamps || [];
    const vtt = timestampsToChaptersVtt(timestamps, videoMetaData.videoDuration);

    const data = await media.stream({
      apiKey: appConfig.oneMinuteCloudApiKey,
      trackingId: videoTrackingId,
    });

    return {
      ...data,
      vtt,
      sessionId,
      analyticsToken,
    };
  }

  async getPlayerSettings(userId: string): Promise<PlayerSettings> {
    const cached = settingsCache.get(userId);
    if (cached) return mergeSettings(DEFAULT_PLAYER_SETTINGS, cached);

    const record = await this.playerRepository.getPlayerSettings(userId);
    
    // Parse JSON string or use object directly if it's already an object
    let settingsObj: any = {};
    if (record?.settings) {
      if (typeof record.settings === 'string') {
        try {
          settingsObj = JSON.parse(record.settings);
        } catch (e) {
          // ignore
        }
      } else {
        settingsObj = record.settings;
      }
    }
    
    const settings = settingsObj as PlayerSettings;
    settingsCache.set(userId, settings);
    return mergeSettings(DEFAULT_PLAYER_SETTINGS, settings);
  }

  async updatePlayerSettings(userId: string, input: any): Promise<PlayerSettings> {
    const sanitized = sanitizeSettings(input);
    const nextSettings = mergeSettings(DEFAULT_PLAYER_SETTINGS, sanitized);

    const saved = await this.playerRepository.upsertPlayerSettings(userId, nextSettings);

    let settingsObj: any = {};
    if (saved?.settings) {
      if (typeof saved.settings === 'string') {
        try {
          settingsObj = JSON.parse(saved.settings);
        } catch (e) {
          // ignore
        }
      } else {
        settingsObj = saved.settings;
      }
    }
    
    const settings = (Object.keys(settingsObj).length > 0 ? settingsObj : nextSettings) as PlayerSettings;
    settingsCache.set(userId, settings);
    return mergeSettings(DEFAULT_PLAYER_SETTINGS, settings);
  }
}
