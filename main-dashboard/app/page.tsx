"use client";

import { useMemo } from "react";
import { BookText, GraduationCap } from "lucide-react";
import GeographicalMap from "../components/charts/geoMap";
import { useUser } from "@clerk/nextjs";
import { useAnalytics } from "../hooks/useAnalytics";
import { useMainAnalytics } from "../hooks/useMainAnalytics";
import { useBilling } from "../hooks/useBilling";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const SIGNAL_DARK = "#3BE39F";
const SIGNAL_LIGHT = "#15875A";

const Page = () => {
  const { user, isLoaded } = useUser();
  const { analyticsQuery } = useAnalytics();
  const { mainAnalyticsQuery } = useMainAnalytics("30d");

  const { data: analytics, isLoading } = analyticsQuery;
  const { data: mainAnalytics } = mainAnalyticsQuery;
  const { currentPlan } = useBilling();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const signal = isDark ? SIGNAL_DARK : SIGNAL_LIGHT;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (!isLoaded) {
    return null;
  }

  const formatBytesToGB = (bytes: number = 0) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1);
  };

  const minutesUsed = analytics?.minutesStreamed?.used_minutes || 0;
  const minutesLimit = analytics?.minutesStreamed?.limit || 1000;
  const minutesPct = minutesLimit > 0 ? ((minutesUsed / minutesLimit) * 100).toFixed(1) : "0.0";
  const minutesRemaining = Math.max(0, minutesLimit - minutesUsed).toFixed(0);

  const storageUsed = Number(analytics?.storageUsed?.used || 0);
  const storageLimit = Number(analytics?.storageUsed?.limit || 5 * 1024 * 1024 * 1024);
  const storagePct = storageLimit > 0 ? ((storageUsed / storageLimit) * 100).toFixed(1) : "0.0";
  const storageRemaining = Math.max(0, storageLimit - storageUsed);

  const planLabel = currentPlan
    ? `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase()} Plan`
    : "Monthly";

  return (
    <div className="text-foreground">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold">
          {greeting},{" "}
          {user?.fullName?.split(" ")[0] ||
            user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
            "User"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your video infrastructure
          today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Minutes Streamed Card */}
        <div className="rounded-sm bg-card border border-hairline p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Minutes Streamed
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm bg-signal/10 text-signal">
                {planLabel}
              </span>
            </div>
            <h2 className="font-mono text-3xl font-semibold text-foreground">
              {minutesUsed.toFixed(0)}{" "}
              <span className="font-mono text-lg text-muted-foreground font-normal">/ {minutesLimit}</span>
            </h2>
          </div>
          <div>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground mb-2">
              <span>Usage</span>
              <span>{minutesPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted-foreground/20 rounded-sm overflow-hidden mb-2">
              <div
                className="h-full bg-signal"
                style={{ width: `${minutesPct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
              <span>• {minutesRemaining} mins remaining</span>
            </div>
          </div>
        </div>

        {/* Total Requests Card */}
        <div className="rounded-sm bg-card border border-hairline p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Total Requests
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm bg-signal/10 text-signal">
                <span className="tally-pulse h-1 w-1 rounded-full bg-signal"></span>
                Real-time
              </span>
            </div>
            <h2 className="font-mono text-3xl font-semibold text-foreground">
              {analytics?.totalRequests?.toLocaleString() || 0}
            </h2>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Total times your videos were requested or played across all
              regions.
            </p>
            <div className="border-t border-hairline pt-2 flex gap-6 font-mono text-[11px] text-muted-foreground">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">
                  {analytics?.requestStats?.avgPerDay || 0}
                </span>
                <span>Avg / Day</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-semibold ${
                  (analytics?.requestStats?.growthPct || 0) >= 0 ? "text-signal" : "text-destructive"
                }`}>
                  {(analytics?.requestStats?.growthPct || 0) > 0 ? "+" : ""}
                  {analytics?.requestStats?.growthPct || 0}%
                </span>
                <span>Growth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Used Card */}
        <div className="rounded-sm bg-card border border-hairline p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Storage Used
              </p>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-sm bg-signal/10 text-signal">
                {planLabel}
              </span>
            </div>
            <h2 className="font-mono text-3xl font-semibold text-foreground">
              {formatBytesToGB(storageUsed)} <span className="font-mono text-lg text-muted-foreground font-normal">GB</span>
            </h2>
          </div>
          <div>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground mb-2">
              <span>{storagePct}% Used</span>
              <span>{formatBytesToGB(storageLimit)} GB Total</span>
            </div>
            <div className="w-full h-1.5 bg-muted-foreground/20 rounded-sm overflow-hidden mb-2">
              <div
                className="h-full bg-signal"
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
              <span>• {formatBytesToGB(storageRemaining)} GB Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Views Over Time — Area Chart */}
      <div className="mt-10 rounded-sm bg-card border border-hairline p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-semibold">Views Over Time</h2>
          <p className="text-sm text-muted-foreground">
            Daily views for the last 30 days
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
              stroke={isDark ? "#1f2023" : "#e5e7eb"}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: isDark ? "#6b7280" : "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: isDark ? "#6b7280" : "#9ca3af", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#101217" : "#ffffff",
                border: `1px solid ${isDark ? "#1f2023" : "#e5e7eb"}`,
                borderRadius: "4px",
                fontSize: "12px",
                color: isDark ? "#ffffff" : "#111827",
              }}
              cursor={{ stroke: isDark ? "#1f2023" : "#e5e7eb" }}
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

      {/* Geo map */}
      <div className="mt-10 w-full flex items-center justify-between flex-wrap gap-y-10">
        <div className="md:w-[60%] pr-0 md:pr-4">
          <h2 className="font-display text-lg font-semibold mb-1">Top Visitor Countries</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Based on requests served.
          </p>
          <div className="w-full max-w-full overflow-hidden p-4">
            <GeographicalMap data={analytics?.visitorCountries || []} />
          </div>
        </div>

        {/* Top URLs Table */}
        <div className="md:w-[40%]">
          <h2 className="font-display text-lg font-semibold mb-1">Top Requested Videos</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Videos that were most frequently requested recently.
          </p>
          <div className="rounded-sm border border-hairline bg-card shadow-sm">
            <table className="min-w-full min-h-75 divide-y divide-hairline">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                    #
                  </th>
                  <th className="px-5 py-3 text-left font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                    Video Title
                  </th>
                  <th className="px-5 py-3 text-right font-mono text-[10px] font-semibold text-muted-foreground tracking-[0.18em] uppercase">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody>
                {(!analytics?.topVideos || analytics.topVideos.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-muted-foreground">
                      No requests yet
                    </td>
                  </tr>
                )}

                {analytics?.topVideos?.map((row, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-muted transition-colors"
                  >
                    {/* Rank */}
                    <td className="px-5 py-3 font-mono text-sm text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* Path with icon */}
                    <td className="px-5 py-3 font-medium text-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded-sm bg-muted border border-hairline flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {row.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-40">{row.title}</span>
                    </td>

                    {/* Requests */}
                    <td className="px-5 py-3 text-right font-mono font-semibold text-signal">
                      {row.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Learn Cards Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Docs Card */}
        <div className="rounded-sm bg-card border border-hairline p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3 text-signal">
            <BookText size={20} />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Documentation
            </h3>
          </div>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>
              <a href="/docs" className="hover:underline">
                Documentation ↗
              </a>
            </li>
            <li>
              <a href="/api" className="hover:underline">
                API Reference ↗
              </a>
            </li>
            <li>
              <a href="/kb" className="hover:underline">
                Knowledge Base ↗
              </a>
            </li>
            <li>
              <a href="/status" className="hover:underline">
                Service Status ↗
              </a>
            </li>
          </ul>
        </div>

        {/* Tutorials Card */}
        <div className="rounded-sm bg-card border border-hairline p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3 text-signal">
            <GraduationCap size={20} />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Tutorials / Guides
            </h3>
          </div>
          <ul className="mt-2 text-sm text-muted-foreground space-y-1">
            <li>
              <a href="/tutorials/first-upload" className="hover:underline">
                How to upload your first video ↗
              </a>
            </li>
            <li>
              <a href="/tutorials/embed" className="hover:underline">
                How to embed videos in your app ↗
              </a>
            </li>
            <li>
              <a href="/tutorials/analytics" className="hover:underline">
                Understanding analytics ↗
              </a>
            </li>
            <li>
              <a
                href="/tutorials/player-customization"
                className="hover:underline"
              >
                Player customization tips ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Page;