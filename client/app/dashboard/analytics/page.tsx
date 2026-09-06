"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronRight, Eye, Clock, Users, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import GeographicalMap from "@/components/charts/geoMap";
import { useUser } from "@clerk/nextjs";
import { useMainAnalytics } from "@/hooks/useMainAnalytics";
import { useAnalytics } from "@/hooks/useAnalytics";

// ── Mock Data for missing backend pieces ────────────────────────────────────────────────

const browserData = [
  { browser: "Chrome", share: 61 },
  { browser: "Safari", share: 21 },
  { browser: "Firefox", share: 10 },
  { browser: "Edge", share: 8 },
];

const rangeLabels = {
  "7d": "Last 7 Days",
  "14d": "Last 14 Days",
  "30d": "Last 30 Days",
};

// ── Formatter Helpers ────────────────────────────────────────────────────────

const formatWatchTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatAvgDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [range, setRange] = useState<"7d" | "14d" | "30d">("30d");
  const { isLoaded } = useUser();
  const { mainAnalyticsQuery } = useMainAnalytics(range);
  const { analyticsQuery } = useAnalytics();

  const { data: mainAnalytics, isLoading } = mainAnalyticsQuery;
  const { data: globalAnalytics } = analyticsQuery;

  // Only saturated accent is signal; the rest read as quiet ink / signal mist, never blue/purple.
  const signal = isDark ? "#3BE39F" : "#15875A";
  const deviceData = (mainAnalytics?.deviceBreakdown ?? []).map((d, i) => ({
    ...d,
    color: isDark
      ? ["#3BE39F", "oklch(0.84 0.19 156 / 0.5)", "oklch(0.84 0.19 156 / 0.28)", "oklch(1 0 0 / 0.14)"][i % 4]
      : ["#15875A", "oklch(0.55 0.15 156 / 0.5)", "oklch(0.55 0.15 156 / 0.28)", "oklch(0.145 0.012 85 / 0.14)"][i % 4],
  }));

  const axisColor = isDark ? "oklch(1 0 0 / 0.40)" : "oklch(0.145 0.012 85 / 0.45)";
  const gridColor = isDark ? "oklch(1 0 0 / 0.06)" : "oklch(0.145 0.012 85 / 0.08)";
  const tooltipBg = isDark ? "oklch(0.16 0.01 85 / 0.95)" : "oklch(0.98 0.005 85 / 0.97)";
  const tooltipBorder = isDark ? "oklch(1 0 0 / 0.1)" : "oklch(0.145 0.012 85 / 0.14)";
  const tooltipText = isDark ? "#ffffff" : "#16130f";
  const hoverFill = isDark ? "oklch(1 0 0 / 0.03)" : "oklch(0.145 0.012 85 / 0.03)";

  if (!isLoaded) return null;

  const overviewStats = [
    {
      label: "Total Views",
      value: mainAnalytics?.overview?.totalViews?.toLocaleString() || "0",
      change: `${(mainAnalytics?.overview?.totalViewsChangePct || 0) > 0 ? "+" : ""}${mainAnalytics?.overview?.totalViewsChangePct || 0}%`,
      positive: (mainAnalytics?.overview?.totalViewsChangePct || 0) >= 0,
      icon: Eye,
    },
    {
      label: "Watch Time",
      value: formatWatchTime(mainAnalytics?.overview?.watchTimeSeconds || 0),
      change: "", // Not returned yet
      positive: true,
      icon: Clock,
    },
    {
      label: "Unique Viewers",
      value: mainAnalytics?.overview?.uniqueViewers?.toLocaleString() || "0",
      change: "", // Not returned yet
      positive: true,
      icon: Users,
    },
    {
      label: "Avg Duration",
      value: formatAvgDuration(mainAnalytics?.overview?.avgDurationSeconds || 0),
      change: "", // Not returned yet
      positive: true,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="text-foreground">
      {/* Breadcrumb — mono instrument path */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">Analytics</span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-6">
        <h1 className="font-display text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track views, engagement, and audience insights across your video
          library.
        </p>
      </div>

      {/* Date Range Selector — segmented control */}
      <div className="flex items-center gap-2 mb-8">
        {(["7d", "14d", "30d"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`cursor-pointer px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] rounded-sm border transition-colors ${
              range === r
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-hairline text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {rangeLabels[r]}
          </button>
        ))}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {overviewStats.map(
          ({ label, value, change, positive, icon: Icon }) => (
            <div
              key={label}
              className="rounded-sm bg-card border border-hairline p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <Icon size={14} className="text-signal shrink-0" />
              </div>
              <h2 className="font-mono text-3xl font-semibold text-foreground">
                {value}
              </h2>
              {change && (
                <p
                  className={`font-mono text-[11px] uppercase tracking-[0.12em] ${positive ? "text-signal" : "text-destructive"}`}
                >
                  {change} vs last period
                </p>
              )}
            </div>
          ),
        )}
      </div>

      {/* Views Over Time — Area Chart */}
      <div className="mt-10 rounded-sm bg-card border border-hairline p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Views Over Time</h2>
          <p className="text-sm text-muted-foreground">
            Daily views for the {rangeLabels[range].toLowerCase()}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={mainAnalytics?.viewsOverTime || []}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={signal} stopOpacity={0.25} />
                <stop offset="95%" stopColor={signal} stopOpacity={0} />
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
              stroke={signal}
              strokeWidth={2}
              fill="url(#viewsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: signal, stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Videos Table */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold mb-1">Top Videos</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Best performing videos in the selected period.
        </p>
        <div className="rounded-sm border border-hairline bg-card overflow-hidden">
          <table className="min-w-full divide-y divide-hairline">
            <thead>
              <tr>
                <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                  #
                </th>
                <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                  Video Title
                </th>
                <th className="px-5 py-3 text-right font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                  Views
                </th>
                <th className="px-5 py-3 text-right font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                  Watch Time
                </th>
                <th className="px-5 py-3 text-right font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                  Avg Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {mainAnalytics?.topVideos?.map((row, index) => (
                <tr
                  key={index}
                  className="group hover:bg-muted transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">
                    {row.title}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold text-signal">
                    {row.views.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-muted-foreground">
                    {formatWatchTime(row.watchTimeSeconds || 0)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-muted-foreground">
                    {formatAvgDuration(row.avgDurationSeconds || 0)}
                  </td>
                </tr>
              ))}
              {(!mainAnalytics?.topVideos || mainAnalytics.topVideos.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
                    No videos found in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device & Browser Breakdown */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown — Donut Chart */}
        <div className="rounded-sm bg-card border border-hairline p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Device Breakdown</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share by device type
          </p>
          <div className="flex items-center gap-6">
            {deviceData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center w-full">No device data yet.</p>
            ) : (
              <>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {deviceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: tooltipText,
                      }}
                      formatter={(value: number | undefined) => [
                        `${value ?? 0}%`,
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3">
                  {deviceData.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {name}
                      </span>
                      <span className="ml-auto text-sm font-mono font-semibold text-foreground pl-4">
                        {value}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Browser Breakdown — Horizontal Bar */}
        <div className="rounded-sm bg-card border border-hairline p-5">
          <h2 className="font-display text-lg font-semibold mb-1">Browser Breakdown</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share by browser
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={browserData}
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
                domain={[0, 100]}
                tick={{ fill: axisColor, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="browser"
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
                  `${value ?? 0}%`,
                  "Share",
                ]}
                cursor={{ fill: hoverFill }}
              />
              <Bar
                dataKey="share"
                fill={signal}
                fillOpacity={0.85}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold mb-1">Geographic Distribution</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Viewer locations based on the last 28 days of data.
        </p>
        <div className="rounded-sm bg-card border border-hairline p-5 overflow-hidden">
          <GeographicalMap data={globalAnalytics?.visitorCountries || []} />
        </div>
      </div>
    </div>
  );
}