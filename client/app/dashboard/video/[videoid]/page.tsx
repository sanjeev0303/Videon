"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  ChevronRight,
  Eye,
  Clock,
  Users,
  TrendingUp,
  Copy,
  Check,
  Calendar,
  FolderOpen,
  Tag,
  Globe,
  Lock,
  Code2,
  Play,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useUser, useAuth } from "@clerk/nextjs";
import { VideonPlayer } from "@videon/player/react";
import { useToggleVideoPublic } from "@/hooks/useVideos";

// Stats are generated dynamically below

const badgeClasses: Record<string, string> = {
  blue: "bg-signal/10 border border-signal/20 text-signal",
  green: "bg-signal/10 border border-signal/20 text-signal",
  purple: "bg-signal/10 border border-signal/20 text-signal",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function VideoDetailsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const params = useParams();
  const videoId = params.videoid as string;
  const { isLoaded, getToken } = useAuth();

  const { data: videoData, isLoading: isVideoLoading } = useQuery({
    queryKey: ["videoMetadata", videoId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/upload/get-video-metadata/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch video metadata");
      return res.json();
    },
    enabled: isLoaded && !!videoId,
  });

  const { data: dailyAnalyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["videoDailyAnalytics", videoId],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/upload/get-daily-analytics/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) return { views_last_28_days: [] };
        throw new Error("Failed to fetch analytics");
      }
      return res.json();
    },
    enabled: isLoaded && !!videoId,
  });

  const togglePublicMutation = useToggleVideoPublic();
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const axisColor = isDark ? "var(--muted-foreground)" : "var(--muted-foreground)";
  const gridColor = "var(--hairline)";
  const tooltipBg = "var(--card)";
  const tooltipBorder = "var(--hairline)";
  const tooltipText = "var(--foreground)";
  const signalColor = "var(--signal)";

  const embedCode = `<iframe src="https://player.videon.com/embed/${videoId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 1500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(videoId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const publicLink = videoData.publicSlug
    ? `${window.location.origin}/v/${videoData.publicSlug}`
    : null;

  const handleCopyPublicLink = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopiedPublicLink(true);
    setTimeout(() => setCopiedPublicLink(false), 1500);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDeviceStats = (devices: string[]) => {
    if (!devices || devices.length === 0) return [];
    const counts: Record<string, number> = {};
    devices.forEach((d) => {
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts).map(([source, visits]) => ({ source, visits })).sort((a, b) => b.visits - a.visits).slice(0, 5);
  };

  if (!isLoaded || isVideoLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Loading video details...
    </div>
  );

  if (!videoData) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      Video not found.
    </div>
  );

  const realVideo = {
    title: videoData.title,
    description: videoData.description || "No description provided.",
    playlist: videoData.playlist_name || "Uncategorized",
    tags: videoData.tags || [],
    status: videoData.status,
    uploadedAt: new Date(videoData.created_at).toLocaleDateString(),
    duration: videoData.videoDuration ? `${Math.floor(videoData.videoDuration / 60)}:${String(Math.floor(videoData.videoDuration % 60)).padStart(2, '0')}` : "Unknown",
    resolution: videoData.resolution || "Unknown",
    fileSize: formatBytes(videoData.videoSize),
    format: videoData.videoContentType || "Unknown",
    thumbnail: videoData.thumbnailTrackingId ? `https://videon-bucket.s3.ap-south-1.amazonaws.com/${videoData.thumbnailTrackingId}` : "https://ik.imagekit.io/sjbr5usgh/Banners/WhatsApp%20Image%202025-04-08%20at%203.51.12%20PM.jpeg?updatedAt=1744410635917",
  };

  const stats = [
    {
      label: "Total Views",
      value: videoData.analytics?.totalViews?.toLocaleString() || "0",
      icon: Eye,
      badge: "blue" as const,
    },
    {
      label: "Watch Time",
      value: videoData.analytics?.minute_streamed ? `${videoData.analytics.minute_streamed} m` : "0m",
      icon: Clock,
      badge: "green" as const,
    },
    {
      label: "Unique Viewers",
      value: videoData.analytics?.uniqueViews?.toLocaleString() || "0",
      icon: Users,
      badge: "purple" as const,
    },
    {
      label: "Avg Duration",
      value: videoData.analytics?.average_view_duration ? `${videoData.analytics.average_view_duration.toFixed(2)}m` : "0m",
      icon: TrendingUp,
      badge: "blue" as const,
    },
  ];

  const viewsOverTime = dailyAnalyticsData?.views_last_28_days || [];
  const topReferrers = getDeviceStats(videoData.analytics?.device || []);

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <Link href="/my-videos" className="hover:text-foreground hover:underline">
          My Videos
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">
          Video Details
        </span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-6">
        <h1 className="font-display text-2xl font-semibold">{realVideo.title}</h1>
        <p className="text-sm text-muted-foreground">
          Video metadata, embed options, and performance analytics.
        </p>
      </div>

      {/* Video Preview + Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-3 rounded-sm bg-card border border-hairline overflow-hidden">
          <div className="relative aspect-video bg-black rounded-t-sm overflow-hidden">
            {isPlaying ? (
              <div className="w-full h-full">
                <VideonPlayer videoTrackingId={videoData.videoTrackingId} autoPlay />
              </div>
            ) : (
              <>
                <Image
                  src={realVideo.thumbnail}
                  alt={realVideo.title}
                  fill
                  className="object-cover"
                />
                {videoData.videoTrackingId ? (
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
                    <p className="text-white font-medium mb-1">Video is processing...</p>
                    <p className="text-white/60 text-sm">Playback is unavailable.</p>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
                  {realVideo.duration}
                </div>
              </>
            )}
          </div>
          <div className="p-5">
            <h2 className="font-display text-lg font-semibold mb-2">{realVideo.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {realVideo.description}
            </p>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="lg:col-span-2 rounded-sm bg-card border border-hairline p-5">
          <h3 className="text-sm font-semibold mb-4">Video Information</h3>
          <div className="space-y-4">
            {/* Video ID */}
            <div className="flex items-start gap-3">
              <FileText
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  Video ID
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium font-mono text-xs truncate">{videoId}</p>
                  <button
                    onClick={handleCopyId}
                    className="text-muted-foreground hover:text-signal transition shrink-0"
                  >
                    {copiedId ? (
                      <Check size={14} className="text-signal" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <Globe
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Status
                </p>
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-sm bg-signal/10 border border-signal/20 text-signal">
                  {realVideo.status}
                </span>
              </div>
            </div>

            {/* Upload Date */}
            <div className="flex items-start gap-3">
              <Calendar
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Uploaded
                </p>
                <p className="text-sm font-medium">{realVideo.uploadedAt}</p>
              </div>
            </div>

            {/* Playlist */}
            <div className="flex items-start gap-3">
              <FolderOpen
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-muted-foreground">
                  Playlist
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-sm bg-signal/10 border border-signal/20 text-signal">
                  {realVideo.playlist}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Tag
                size={16}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {realVideo.tags.length > 0 ? realVideo.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-sm bg-muted border border-hairline text-muted-foreground"
                    >
                      {tag}
                    </span>
                  )) : (
                    <span className="text-xs text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            </div>

            {/* File Details */}
            <div className="border-t border-hairline pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                File Details
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="font-medium">{realVideo.format}</span>
                <span className="text-muted-foreground">
                  Resolution
                </span>
                <span className="font-medium">{realVideo.resolution}</span>
                <span className="text-muted-foreground">Size</span>
                <span className="font-medium">{realVideo.fileSize}</span>
                <span className="text-muted-foreground">
                  Duration
                </span>
                <span className="font-medium">{realVideo.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="mt-6 rounded-sm bg-card border border-hairline p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Embed Code</h3>
          </div>
          <button
            onClick={handleCopyEmbed}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-hairline text-foreground hover:bg-muted transition-colors"
          >
            {copiedEmbed ? (
              <>
                <Check size={12} className="text-signal" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy Code
              </>
            )}
          </button>
        </div>
        <div className="bg-muted/40 rounded-sm p-4 font-mono text-xs text-muted-foreground overflow-x-auto border border-hairline">
          {embedCode}
        </div>
      </div>

      {/* Public Link */}
      <div className="mt-6 rounded-sm bg-card border border-hairline p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-semibold">Public Link</h3>
          </div>
          {publicLink ? (
            <button
              onClick={() =>
                togglePublicMutation.mutate({ videoId, isPublic: false })
              }
              disabled={togglePublicMutation.isPending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-hairline text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Lock size={12} />
              Make Private
            </button>
          ) : (
            <button
              onClick={() =>
                togglePublicMutation.mutate({ videoId, isPublic: true })
              }
              disabled={togglePublicMutation.isPending}
              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-hairline text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              <Globe size={12} />
              Make Public
            </button>
          )}
        </div>
        {publicLink ? (
          <div className="flex items-center gap-2 bg-muted/40 rounded-sm p-4 border border-hairline">
            <code className="flex-1 font-mono text-xs text-muted-foreground break-all">
              {publicLink}
            </code>
            <button
              onClick={handleCopyPublicLink}
              className="text-muted-foreground hover:text-signal transition shrink-0"
              title={copiedPublicLink ? "Copied!" : "Copy public link"}
            >
              {copiedPublicLink ? (
                <Check size={14} className="text-signal" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This video is private. Make it public to share with anyone.
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, badge }) => (
          <div
            key={label}
            className="rounded-sm bg-card border border-hairline p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-sm ${badgeClasses[badge]}`}
              >
                <Icon size={12} className="inline mr-1" />
                {label.split(" ")[0]}
              </span>
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mt-2">
              {value}
            </h2>
          </div>
        ))}
      </div>

      {/* Views Over Time */}
      <div className="mt-10 rounded-sm bg-card border border-hairline p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Views Over Time</h2>
          <p className="text-sm text-muted-foreground">
            Daily views since upload
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={viewsOverTime}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={signalColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={signalColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: "4px",
                fontSize: "12px",
                color: tooltipText,
              }}
              cursor={{ stroke: gridColor }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke={signalColor}
              strokeWidth={2}
              fill="url(#viewsGrad)"
              dot={false}
              activeDot={{ r: 4, fill: signalColor, stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Referrers */}
      <div className="mt-10 rounded-sm bg-card border border-hairline p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Top Referrers</h2>
          <p className="text-sm text-muted-foreground">
            Where your viewers are coming from
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          {topReferrers.length > 0 ? (
            <BarChart
              data={topReferrers}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: tooltipText,
                }}
                formatter={(value: number | undefined) => [
                  `${(value ?? 0).toLocaleString()} visits`,
                  "",
                ]}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="visits"
                fill={signalColor}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No device data available yet.
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
