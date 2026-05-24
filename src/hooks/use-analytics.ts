import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type AnalyticsOverview = {
  range: string;
  totals: {
    views: number;
    clicks: number;
    ctr: number;
    conversations: number;
    uniqueVisitors: number;
    liveVisitors: number;
  };
  series: number[];
  sources: { name: string; value: number; color?: string }[];
  countries: { flag: string; name: string; pct: number }[];
  tools: {
    id: string;
    name: string;
    domain: string;
    url: string;
    iconUrl: string | null;
    primaryColor: string | null;
    views: number;
    clicks: number;
    ctr: number;
    trend: number;
    series: number[];
  }[];
  realtime: { toolName: string; page: string; country: string; time: string }[];
};

export type AnalyticsRange = "7d" | "30d" | "90d";

export function useAnalyticsOverview(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: ["analytics", "overview", range],
    queryFn: () =>
      apiFetch<AnalyticsOverview>(`/api/v1/analytics/overview?range=${range}`),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
  });
}
