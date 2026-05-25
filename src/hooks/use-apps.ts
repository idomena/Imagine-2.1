import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { CATEGORIES, type Tool } from "@/lib/store";

export type ApiApp = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  launchUrl: string | null;
  iconUrl: string | null;
  primaryColor: string | null;
  categoryId: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
};

function toTool(app: ApiApp, categoryMap: Map<string, string>): Tool {
  let domain = "";
  try {
    domain = new URL(app.launchUrl ?? "").hostname.replace(/^www\./, "");
  } catch {}

  return {
    id: app.id,
    name: app.name,
    tagline: app.tagline ?? "",
    description: app.description ?? "",
    url: app.launchUrl ?? "#",
    domain,
    faviconUrl:
      app.iconUrl ??
      (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ""),
    coverColor: app.primaryColor ?? "oklch(0.78 0.14 175)",
    category: app.categoryId ? (categoryMap.get(app.categoryId) ?? "Other") : "Other",
    tags: [],
    upvotes: 0,
    makerId: "",
    createdAt: new Date(app.publishedAt ?? app.createdAt).getTime(),
  };
}

export function useCategories() {
  const fallbackCategories = CATEGORIES.filter((name) => name !== "All").map((name) => ({
    id: name,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<ApiCategory[]>("/api/v1/categories", { skipAuth: true }),
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  return {
    ...query,
    data: query.isError ? fallbackCategories : query.data,
    isError: false,
  };
}

export function useApps() {
  const { data: categories } = useCategories();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["apps"],
    queryFn: () =>
      apiFetch<{ items: ApiApp[]; total: number }>("/api/v1/apps?limit=50", {
        skipAuth: true,
      }),
    staleTime: 2 * 60 * 1000,
    retry: 0,
  });

  const categoryMap = new Map(
    (categories ?? []).map((c: ApiCategory) => [c.id, c.name]),
  );

  const tools: Tool[] = isError
    ? []
    : (data?.items ?? []).map((app) => toTool(app, categoryMap));

  return {
    tools,
    isLoading: isLoading && !isError,
    isError: false,
    usingFallback: false,
    backendError: error instanceof Error ? error.message : null,
    total: data?.total ?? 0,
  };
}

