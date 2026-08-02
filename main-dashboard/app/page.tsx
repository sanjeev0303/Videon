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

const Page = () => {
  const { user, isLoaded } = useUser();
  const { analyticsQuery } = useAnalytics();
  const { mainAnalyticsQuery } = useMainAnalytics("30d");
  
  const { data: analytics, isLoading } = analyticsQuery;
  const { data: mainAnalytics } = mainAnalyticsQuery;
  const { currentPlan } = useBilling();
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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

  return (
    <div className="text-black dark:text-white">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {greeting},{" "}
          {user?.fullName?.split(" ")[0] ||
            user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
            "User"}{" "}
          👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your video infrastructure
          today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Bandwidth Card */}
        <div className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Minutes Streamed
              </p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                {currentPlan ? `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase()} Plan` : "Monthly"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {minutesUsed.toFixed(0)}{" "}
              <span className="text-lg text-gray-400 font-normal">/ {minutesLimit}</span>
            </h2>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-2">
              <span>Usage</span>
              <span>{minutesPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${minutesPct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>• {minutesRemaining} mins remaining</span>
            </div>
          </div>
        </div>

        {/* Requests Card */}
        <div className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Requests
              </p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                Real-time
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalRequests?.toLocaleString() || 0}
            </h2>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total times your videos were requested or played across all
              regions.
            </p>
            <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex gap-6 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {analytics?.requestStats?.avgPerDay || 0}
                </span>
                <span>Avg / Day</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-semibold ${
                  (analytics?.requestStats?.growthPct || 0) >= 0 ? "text-green-500" : "text-red-500"
                }`}>
                  {(analytics?.requestStats?.growthPct || 0) > 0 ? "+" : ""}
                  {analytics?.requestStats?.growthPct || 0}%
                </span>
                <span>Growth</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Storage Used
              </p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                {currentPlan ? `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).toLowerCase()} Plan` : "Allocated"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatBytesToGB(storageUsed)} <span className="text-lg text-gray-400 font-normal">GB</span>
            </h2>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mb-2">
              <span>{storagePct}% Used</span>
              <span>{formatBytesToGB(storageLimit)} GB Total</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>• {formatBytesToGB(storageRemaining)} GB Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Views Over Time — Area Chart */}
      <div className="mt-10 rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] shadow-sm p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Views Over Time</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                borderRadius: "8px",
                fontSize: "12px",
                color: isDark ? "#ffffff" : "#111827",
              }}
              cursor={{ stroke: isDark ? "#1f2023" : "#e5e7eb" }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#viewsGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Geo map */}
      <div className="mt-10 w-full flex items-center justify-between flex-wrap gap-y-10">
        <div className="md:w-[60%] pr-0 md:pr-4">
          <h2 className="text-lg font-semibold mb-1">Top Visitor Countries</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Based on requests served.
          </p>
          <div className="w-full max-w-full overflow-hidden p-4">
            <GeographicalMap data={analytics?.visitorCountries || []} />
          </div>
        </div>

        {/* Top URLs Table */}
        <div className="md:w-[40%]">
          <h2 className="text-lg font-semibold mb-1">Top Requested Videos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Videos that were most frequently requested recently.
          </p>
          <div className="rounded! border border-gray-200 dark:border-[#1f2023] bg-white dark:bg-[#101217] shadow-sm">
            <table className="min-w-full min-h-75 divide-y divide-gray-100 dark:divide-gray-800">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                    #
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                    Video Title
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide uppercase">
                    Requests
                  </th>
                </tr>
              </thead>
              <tbody>
                {(!analytics?.topVideos || analytics.topVideos.length === 0) && (
                  <tr>
                    <td colSpan={3} className="text-center py-4">
                      No requests yet
                    </td>
                  </tr>
                )}

                {analytics?.topVideos?.map((row, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-blue-50 dark:hover:bg-[#1c1f23] transition-colors"
                  >
                    {/* Rank */}
                    <td className="px-5 py-3 text-sm font-bold text-gray-400 dark:text-gray-500">
                      {["🥇", "🥈", "🥉"][index] || `${index + 1}`}
                    </td>

                    {/* Path with icon */}
                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        {row.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-40">{row.title}</span>
                    </td>

                    {/* Requests */}
                    <td className="px-5 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
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
        <div className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3 text-orange-500">
            <BookText size={20} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Documentation
            </h3>
          </div>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
        <div className="rounded-xl bg-white dark:bg-[#101217] border border-gray-200 dark:border-[#1f2023] p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3 text-red-500">
            <GraduationCap size={20} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Tutorials / Guides
            </h3>
          </div>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
