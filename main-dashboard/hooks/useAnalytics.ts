import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export type AnalyticsData = {
  minutesStreamed: {
    used_seconds: number;
    used_minutes: number;
    limit: number;
  };
  storageUsed: {
    used: number;
    limit: number;
  };
  overallUsagePct: number;
  totalRequests: number;
  requestStats: {
    avgPerDay: number;
    growthPct: number;
    windowDays: number;
  };
  visitorCountries: { country: string; views: number }[];
  topVideos: { id: string; title: string; views: number }[];
};

export const useAnalytics = () => {
  const { getToken, isLoaded } = useAuth();

  const fetchAnalytics = async (): Promise<AnalyticsData> => {
    const token = await getToken();
    if (!token) throw new Error("No token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  };

  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    enabled: isLoaded,
  });

  return {
    analyticsQuery,
  };
};
