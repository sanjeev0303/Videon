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

// Stats are generated dynamically below

const badgeClasses: Record<string, string> = {
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
  purple:
    "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
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

  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const axisColor = isDark ? "#6b7280" : "#9ca3af";
  const gridColor = isDark ? "#1f2023" : "#e5e7eb";
  const tooltipBg = isDark ? "#101217" : "#ffffff";
  const tooltipBorder = isDark ? "#1f2023" : "#e5e7eb";
  const tooltipText = isDark ? "#ffffff" : "#111827";

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
    <div className="flex items-center justify-center h-64 text-gray-500">
      Loading video details...
    </div>
  );

  if (!videoData) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
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
    <div className="text-black dark:text-white">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <Link href="/my-videos" className="hover:underline">
          My Videos
        </Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Video Details
        </span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-semibold">{realVideo.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Video metadata, embed options, and performance analytics.
        </p>
      </div>

      {/* Video Preview + Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-3 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm overflow-hidden">
          <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
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
                    <div className="w-16 h-16 rounded-full bg-white/90 dark:bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play
                        size={28}
                        className="text-gray-900 ml-1"
                        fill="currentColor"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <p className="text-white font-medium mb-1">Video is processing...</p>
                    <p className="text-gray-300 text-sm">Playback is unavailable.</p>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-xs text-white font-medium pointer-events-none">
                  {realVideo.duration}
                </div>
              </>
            )}
          </div>
          <div className="p-5">
            <h2 className="text-lg font-semibold mb-2">{realVideo.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {realVideo.description}
            </p>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5">
          <h3 className="text-sm font-semibold mb-4">Video Information</h3>
          <div className="space-y-4">
            {/* Video ID */}
            <div className="flex items-start gap-3">
              <FileText
                size={16}
                className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Video ID
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{videoId}</p>
                  <button
                    onClick={handleCopyId}
                    className="text-gray-400 hover:text-blue-500 transition shrink-0"
                  >
                    {copiedId ? (
                      <Check size={14} className="text-green-500" />
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
                className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  {realVideo.status}
                </span>
              </div>
            </div>

            {/* Upload Date */}
            <div className="flex items-start gap-3">
              <Calendar
                size={16}
                className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Uploaded
                </p>
                <p className="text-sm font-medium">{realVideo.uploadedAt}</p>
              </div>
            </div>

            {/* Playlist */}
            <div className="flex items-start gap-3">
              <FolderOpen
                size={16}
                className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Playlist
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {realVideo.playlist}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-start gap-3">
              <Tag
                size={16}
                className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {realVideo.tags.length > 0 ? realVideo.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  )) : (
                    <span className="text-xs text-gray-400">No tags</span>
                  )}
                </div>
              </div>
            </div>

            {/* File Details */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                File Details
              </p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Format</span>
                <span className="font-medium">{realVideo.format}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Resolution
                </span>
                <span className="font-medium">{realVideo.resolution}</span>
                <span className="text-gray-500 dark:text-gray-400">Size</span>
                <span className="font-medium">{realVideo.fileSize}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Duration
                </span>
                <span className="font-medium">{realVideo.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embed Code */}
      <div className="mt-6 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-semibold">Embed Code</h3>
          </div>
          <button
            onClick={handleCopyEmbed}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {copiedEmbed ? (
              <>
                <Check size={12} className="text-green-500" />
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
        <div className="bg-gray-50 dark:bg-[#0a0c10] rounded-lg p-4 font-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
          {embedCode}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, badge }) => (
          <div
            key={label}
            className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {label}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[badge]}`}
              >
                <Icon size={12} className="inline mr-1" />
                {label.split(" ")[0]}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </h2>
          </div>
        ))}
      </div>

      {/* Views Over Time */}
      <div className="mt-10 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Views Over Time</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                borderRadius: "8px",
                fontSize: "12px",
                color: tooltipText,
              }}
              cursor={{ stroke: gridColor }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#viewsGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Referrers */}
      <div className="mt-10 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Top Referrers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: tooltipText,
                }}
                formatter={(value: number | undefined) => [
                  `${(value ?? 0).toLocaleString()} visits`,
                  "",
                ]}
                cursor={{ fill: isDark ? "#1c1f23" : "#f0f7ff" }}
              />
              <Bar
                dataKey="visits"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
              No device data available yet.
            </div>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
