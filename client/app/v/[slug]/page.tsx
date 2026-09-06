"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideonPlayer } from "@videon/player/react";
import { Globe, Play } from "lucide-react";

type PublicVideo = {
  id: string;
  title: string;
  description: string | null;
  thumbnailTrackingId: string | null;
  videoTrackingId: string | null;
  status: string;
};

export default function PublicVideoPage() {
  const params = useParams();
  const publicSlug = params.slug as string;
  const [isPlaying, setIsPlaying] = useState(false);

  const {
    data: video,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["publicVideo", publicSlug],
    queryFn: async (): Promise<PublicVideo> => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/public/videos/${publicSlug}`,
      );
      if (!res.ok) throw new Error("Video not found");
      return res.json();
    },
    enabled: !!publicSlug,
    retry: false,
  });

  const thumbnail = video?.thumbnailTrackingId
    ? `https://videon-bucket.s3.ap-south-1.amazonaws.com/${video.thumbnailTrackingId}`
    : null;

  const canPlay = video?.status === "READY" && !!video.videoTrackingId;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-hairline">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight"
          >
            Videon
          </Link>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <Globe size={12} />
            Public Video
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Loading video...
          </div>
        ) : isError || !video ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
            <Globe size={32} className="text-muted-foreground/50" />
            <p className="font-display text-lg font-semibold">
              Video not found
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              This video is private, was removed, or the link is incorrect.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-sm bg-card border border-hairline overflow-hidden">
              <div className="relative aspect-video bg-black">
                {isPlaying ? (
                  video.videoTrackingId ? (
                    <VideonPlayer
                      videoTrackingId={video.videoTrackingId}
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/60 text-sm">
                      Playback unavailable.
                    </div>
                  )
                ) : (
                  <>
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={video.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted" />
                    )}
                    {canPlay ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                        onClick={() => setIsPlaying(true)}
                      >
                        <div className="w-16 h-16 rounded-full bg-signal/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play
                            size={28}
                            className="text-background ml-1"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                        <p className="text-white font-medium">
                          Video is processing...
                        </p>
                        <p className="text-white/60 text-sm">
                          Playback will be available shortly.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <h1 className="font-display text-2xl font-semibold">
                {video.title}
              </h1>
              {video.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {video.description}
                </p>
              ) : null}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-hairline">
        <div className="max-w-3xl mx-auto px-4 py-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Videon · Private video hosting
        </div>
      </footer>
    </div>
  );
}