import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export type MainAnalyticsData = {
  range: number;
  overview: {
    totalViews: number;
    totalViewsChangePct: number;
    watchTimeSeconds: number;
    uniqueViewers: number;
    avgDurationSeconds: number;
  };
  viewsOverTime: { date: string; views: number }[];
  topVideos: {
    id: string;
    title: string;
    views: number;
    watchTimeSeconds: number;
    avgDurationSeconds: number;
  }[];
  deviceBreakdown: { name: string; value: number }[];
};

export const useMainAnalytics = (range: "7d" | "14d" | "30d" = "30d") => {
  const { getToken, isLoaded } = useAuth();

  const fetchMainAnalytics = async (): Promise<MainAnalyticsData> => {
    const token = await getToken();
    if (!token) throw new Error("No token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/analytics/main?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch main analytics");
    return res.json();
  };

  const mainAnalyticsQuery = useQuery({
    queryKey: ["main-analytics", range],
    queryFn: fetchMainAnalytics,
    enabled: isLoaded,
    placeholderData: keepPreviousData,
  });

  return {
    mainAnalyticsQuery,
  };
};
