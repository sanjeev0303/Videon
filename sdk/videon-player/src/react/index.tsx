import { useEffect, useMemo, useRef, useState } from "react";
import {
  MediaPlayerInstance,
  MediaPlayer,
  MediaProvider,
  Track,
  Captions,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
  type DefaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { VideonPlayerProps } from "../types/index.js";
import {
  VideonPlayIcon,
  VideonPauseIcon,
  VideonMuteIcon,
  VideonUnmuteIcon,
  VideonFullscreenEnterIcon,
  VideonFullscreenExitIcon,
  VideonSeekBackwardIcon,
  VideonSeekForwardIcon,
  VideonSettingsIcon,
  VideonPipEnterIcon,
  VideonPipExitIcon,
  VideonCaptionOn,
  VideonCaptionOff,
  VideonPlayBlockIcon,
  VideonPauseBlockIcon,
} from "../icons/index.js";
import { getUserCountry } from "../utils/index.js";

// ==========================================
// 1. DYNAMIC STYLE INJECTION & THEMING
// ==========================================
function injectVideonCaptionStyles() {
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    [data-media-player][data-layout="video"] .vds-captions {
      bottom: 1% !important;
      transition: bottom 0.2s ease;
    }

    [data-media-player][data-layout="video"][data-hover] .vds-captions,
    [data-media-player][data-layout="video"][data-controls] .vds-captions {
      bottom: 8% !important;
    }

    [data-media-player][data-layout="video"] .vds-captions [data-part="cue"] {
      display: inline-block;
      background: var(--vmx-caption-bg, rgba(10, 10, 12, 0.55)) !important;
      color: var(--vmx-caption-color, #fff) !important;
      font-size: var(--vmx-caption-size, 18px) !important;
      font-weight: 500 !important;
      line-height: 1.45 !important;
      padding: 0.18em 0.5em !important;
      border-radius: 4px !important;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85) !important;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }

    /* Player slider customization */
    [data-media-player][data-layout="video"] {
      --media-brand: var(--vmx-primary, #3b82fc);
      --media-slider-track-fill-bg: var(--vmx-primary, #3b82fc)e;
      --media-slider-track-progress-bg: rgba(244, 63, 94, 0.35);
      --media-slider-track-bg: rgba(255, 255, 255, 0.18);
      --media-slider-thumb-bg: #fff;
    }

    [data-media-player][data-layout="video"] .vds-time-slider {
      --slider-track-height: 4px;
      --slider-track-border-radius: 999px;
    }

    [data-media-player][data-layout="video"] .vds-slider-track {
      background: var(--media-slider-track-bg) !important;
    }

    [data-media-player][data-layout="video"] .vds-slider-track-fill {
      background: var(--media-slider-track-bg) !important;
    }

    [data-media-player][data-layout="video"] .vds-slider-track-progress {
      background: var(--media-slider-track-progress-bg) !important;
    }

    [data-mdeia-player][data-layout="video"].vds-time-slider .vds-slider-progress{
    background-color: var(--vmx-burrered, rgba(255, 255, 255, 0.22)) !important
    }

    [data-mdeia-player][data-layout="video"].vds-time-slider .vds-slider-chapter .vds-slider-progress{
    background-color: var(--vmx-burrered, rgba(255, 255, 255, 0.22)) !important
    }

    @keyframes videon-spin {
      to { transform: rotate(360deg); }
    }

    .videon-loader {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(225, 29, 72, 0.2);
      border-top-color: var(--vmx-primary, #3b82f6);
      border-radius: 50%;
      animation: videon-spin 0.8s linear infinite;
    }
  `;

  document.head.appendChild(style);
}

// ==========================================
// 2. PLAYER ICON CONFIGURATION
// ==========================================
const videonIcons: DefaultLayoutIcons = {
  ...defaultLayoutIcons,
  PlayButton: {
    Play: VideonPlayIcon,
    Pause: VideonPauseIcon,
    Replay: VideonPlayIcon,
  },
  MuteButton: {
    Mute: VideonMuteIcon,
    VolumeHigh: VideonUnmuteIcon,
    VolumeLow: VideonUnmuteIcon,
  },
  FullscreenButton: {
    Enter: VideonFullscreenEnterIcon,
    Exit: VideonFullscreenExitIcon,
  },
  SeekButton: {
    Backward: VideonSeekBackwardIcon,
    Forward: VideonSeekForwardIcon,
  },
  Menu: {
    ...defaultLayoutIcons.Menu,
    Settings: VideonSettingsIcon,
  },
  PIPButton: {
    Enter: VideonPipEnterIcon,
    Exit: VideonPipExitIcon,
  },
  CaptionButton: {
    On: VideonCaptionOn,
    Off: VideonCaptionOff,
  },
};

// ==========================================
// 3. TOKEN PARSING UTILITIES
// ==========================================
function extractTokenParams(src: string): string {
  try {
    const url = new URL(src);

    const token = url.searchParams.get("token");
    const expires = url.searchParams.get("expires");
    const tokenPath = url.searchParams.get("token_path");

    if (token && expires && tokenPath) {
      return `token=${encodeURIComponent(token)}&expires=${encodeURIComponent(expires)}&token_path=${encodeURIComponent(tokenPath)}`;
    }
  } catch (error) {}

  return "";
}

// ==========================================
// 4. SUBTITLE & THUMBNAIL CUSTOM HOOKS
// ==========================================
function useSignedThumbnailVtt(vttUrl: string, tokenParams: string) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!vttUrl) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      const res = await fetch(vttUrl);
      if (!res.ok) throw new Error("Failed to load thumbnail vtt");

      const vtt = await res.text();
      const baseUrl = new URL(vttUrl);

      const signedVtt = vtt.replace(
        /^(?!WEBVTT|NOTE|\s*$|\d{2}:\d{2}:\d{2})\s*(.+)$/gm,
        (line) => {
          const [pathWithQuery, fragment = ""] = line.trim().split("#");
          const imgUrl = new URL(pathWithQuery, baseUrl);

          const params = new URLSearchParams(tokenParams);
          params.forEach((value, key) => imgUrl.searchParams.set(key, value));

          return `${imgUrl.toString()}${fragment ? `#${fragment}` : ""}`;
        },
      );

      objectUrl = URL.createObjectURL(
        new Blob([signedVtt], { type: "text/vtt" }),
      );

      if (!cancelled) setBlobUrl(objectUrl);
    }

    load().catch(console.error);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [vttUrl, tokenParams]);

  return blobUrl;
}

function srtToVtt(srt: string) {
  return (
    "WEBVTT\n\n" +
    srt
      .replace(/\r+/g, "")
      .replace(/^\d+\n/gm, "")
      .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")
  );
}

function useSrtAsVttUrl(srtUrl?: string) {
  const [vttUrl, setVttUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!srtUrl) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    async function convert() {
      const res = await fetch(srtUrl!);
      if (!res.ok) throw new Error("Failed to load subtitles");

      const srt = await res.text();
      const vtt = srtToVtt(srt);

      const blob = new Blob([vtt], { type: "text/vtt" });
      objectUrl = URL.createObjectURL(blob);

      if (!cancelled) setVttUrl(objectUrl);
    }

    convert().catch(console.error);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [srtUrl]);

  return vttUrl;
}

// ==========================================
// 5. MAIN VIDEON PLAYER COMPONENT
// ==========================================
export function VideonPlayer({
  videoTrackingId,
  autoPlay,
  playsInline,
  onReady,
  onError,
}: VideonPlayerProps) {
  const player = useRef<MediaPlayerInstance>(null);
  const [videoData, setVideoData] = useState<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // View-locking & Heartbeat Refs
  const uniqueEligible = useRef(false);
  const uniqueLocked = useRef(false);
  const lastHeartbeatTime = useRef<number>(0);

  const VIEW_LOCK_PREFIX = "vmx_view_";
  const UNIQUE_VIEW_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days

  // 1. Initialize User Country Code
  useEffect(() => {
    async function initCountry() {
      try {
        const country = await getUserCountry();
        setUserCountry(country);
      } catch (error) {
        console.error("Failed to initialize user country:", error);
      }
    }
    initCountry();
  }, []);

  // 2. Analytics View-Locking Initialization (30-Day TTL)
  useEffect(() => {
    uniqueEligible.current = false;
    uniqueLocked.current = false;

    if (!videoTrackingId) return;

    try {
      const lockKey = `${VIEW_LOCK_PREFIX}${videoTrackingId}`;
      const lastViewRaw = localStorage.getItem(lockKey);

      if (!lastViewRaw) {
        uniqueEligible.current = true;
        return;
      }

      const lastView = Number(lastViewRaw);
      if (!Number.isFinite(lastView)) {
        localStorage.removeItem(lockKey);
        uniqueEligible.current = true;
        return;
      }

      const ageMs = Date.now() - lastView;
      if (ageMs >= UNIQUE_VIEW_TTL_MS) {
        localStorage.removeItem(lockKey);
        uniqueEligible.current = true;
      }
    } catch (error) {
      uniqueEligible.current = false;
    }
  }, [videoTrackingId]);

  // 3. Fetch Video Configuration & Streaming Metadata
  const fetchVideoData = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/videon/player?videoTrackingId=${videoTrackingId}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVideoData(data);
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    injectVideonCaptionStyles();
    if (videoTrackingId) {
      fetchVideoData();
    }
  }, [videoTrackingId]);

  const playerSettings = videoData?.playerSettings ?? {};
  const primaryColor = playerSettings?.primaryColor ?? "#e11d48";
  const fontFamily = playerSettings?.fontFamily;
  const captionColor = playerSettings?.captions?.fontColor ?? "#ffffff"
  const captionBg = playerSettings?.captions?.backgroundColor ?? "#000000"
  const captionSize = Number(playerSettings?.captions?.fontSize ?? "18")
  const playPreset = playerSettings?.playButton?.present;

  const playerStyle = useMemo(() => {
  const style: any = {
    "--vmx-primary": primaryColor,
    "--vmx-caption-color": captionColor,
    "--vmx-caption-bg": captionBg,
    "--vmx-caption-size": `${Number.isFinite(captionSize) ? captionSize : 18}px`,
  };

  if (typeof fontFamily === "string" && fontFamily.trim()) {
    style.foFamily = fontFamily;
  }

  return style;
  }, [primaryColor, captionColor, captionBg, captionSize, fontFamily])

  const layoutIcons = useMemo<DefaultLayoutIcons>(() => {
    if (playPreset === "minimal" ) return defaultLayoutIcons;
    if (playPreset === "block") {
  return {
    ...videonIcons,
    PlayButton: {
      Play: VideonPlayBlockIcon,
      Pause: VideonPauseBlockIcon,
      Replay: VideonPlayBlockIcon,
    },
  };
};
return videonIcons;
  }, [playPreset])

  // 4. Analytics Telemetry Dispatcher
  const sendAnalyticsEvent = async (
    event: "play" | "pause" | "heartbeat" | "seek" | "ended",
    currentTime: number,
  ) => {
    if (!videoData?.analyticsToken) return;

    try {
      await fetch("/api/videon/player?kind=event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          event,
          currentTime,
          token: videoData.analyticsToken,
          geo: userCountry || undefined,
          isUnique:
            uniqueEligible.current &&
            !uniqueLocked.current &&
            currentTime >= 3,
        }),
      });

      // Lock unique impression after 3 seconds of watch time
      if (
        uniqueEligible.current &&
        !uniqueLocked.current &&
        currentTime >= 3
      ) {
        uniqueLocked.current = true;
        try {
          const lockKey = `${VIEW_LOCK_PREFIX}${videoTrackingId}`;
          localStorage.setItem(lockKey, Date.now().toString());
        } catch (error) {}
      }
    } catch (error) {
      console.error("Failed to send analytics event", error);
    }
  };

  // 5. Derive Media Paths & Custom Hook Invocations
  const videoSrc = videoData?.playlistUrl || "";
  const tokenParams = extractTokenParams(videoSrc);
  const subtitleUrl = videoData?.subtitleUrl || undefined;
  const subtitleVttUrl = useSrtAsVttUrl(subtitleUrl);
  const previewVttUrl = videoData?.timelineSpritesUrl || "";
  const signedThumbnailVtt = useSignedThumbnailVtt(
    previewVttUrl,
    tokenParams,
  );
  const chaptersUrl =
    videoData?.vtt &&
    URL.createObjectURL(
      new Blob([videoData?.vtt], { type: "text/vtt" }),
    );

  // 6. Loading & Error States
  if (isLoading && !videoData) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-black text-white gap-4">
        <div className="videon-loader"></div>
      </div>
    );
  }

  if (!videoData && !isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        Error loading video.
      </div>
    );
  }

  // 7. Player Render with Analytics Event Listeners
  return (
    <MediaPlayer
      ref={player}
      title="Videon Player"
      playsInline={playsInline ?? true}
      autoPlay={autoPlay ?? false}
      src={videoSrc}
      style={playerStyle}
      onCanPlay={onReady}
      onError={onError}
      onPlay={() => {
        const currentTime = player?.current?.currentTime || 0;
        sendAnalyticsEvent("play", currentTime);
        lastHeartbeatTime.current = currentTime;
      }}
      onPause={() => {
        sendAnalyticsEvent("pause", player.current?.currentTime || 0);
      }}
      onEnded={() => {
        sendAnalyticsEvent("ended", player.current?.currentTime || 0);
      }}
      onSeeked={() => {
        sendAnalyticsEvent("seek", player.current?.currentTime || 0);
      }}
      onTimeUpdate={(event) => {
        const currentTime = event.currentTime;
        // Fire heartbeat telemetry exactly once every 15 seconds
        if (currentTime - lastHeartbeatTime.current >= 15) {
          sendAnalyticsEvent("heartbeat", currentTime);
          lastHeartbeatTime.current = currentTime;
        }
      }}
      onProviderChange={(provider: any) => {
        if (provider?.type === "hls") {
          provider.config = {
            xhrSetup: (xhr: XMLHttpRequest, url: string) => {
              if (!url.includes("token=")) {
                const separator = url?.includes("?") ? "&" : "?";
                xhr.open(
                  "GET",
                  `${url}${separator}${tokenParams}`,
                  true,
                );
              }
            },
          };
        }
      }}
    >
      <MediaProvider>
        <Track
          src={chaptersUrl}
          kind="chapters"
          label="Chapters"
          default
        />
        {subtitleVttUrl && (
          <Track
            src={subtitleVttUrl}
            kind="subtitles"
            label="English"
            lang="en"
            default
          />
        )}
        <Captions className="vds-captions" />
      </MediaProvider>
      <DefaultVideoLayout
        thumbnails={signedThumbnailVtt}
        icons={layoutIcons}
        slots={{
          googleCastButton: null,
          chaptersMenu: null,
        }}
      />
    </MediaPlayer>
  );
}
