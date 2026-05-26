import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Rocket, Trash2, ExternalLink, Plus, TrendingUp, Eye,
  Activity, Archive, Loader2, Shield, RefreshCw, Radio, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

// ── Types ────────────────────────────────────────────────────────────────────

type AppData = {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  launchUrl: string | null;
  iconUrl: string | null;
  status: string;
  createdAt: string;
  publishedAt: string | null;
};

type AppsPage = {
  items: AppData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

type AnalyticsData = {
  apps: AppData[];
  byApp: Record<string, Array<{ date: string; views: number }>>;
  totals: Record<string, number>;
};

type LiveEvent = {
  id: string;
  createdAt: string;
  userAgent: string | null;
  app: { name: string; iconUrl: string | null; slug: string };
};

type LiveData = {
  activeCount: number;
  recentEvents: LiveEvent[];
};

// ── Root ────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <LoadingState />;
  if (!isAuthenticated || !user) return null;

  const handleLogout = async () => { await logout(); navigate({ to: "/" }); };

  const logoutBar = (
    <div className="md:hidden flex items-center justify-between px-4 pt-4 pb-0">
      <span className="text-sm text-muted-foreground truncate">{user.displayName ?? user.email}</span>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/70 hover:text-foreground"
      >
        <LogOut className="size-4" /> Log out
      </button>
    </div>
  );

  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    return <>{logoutBar}<AdminDashboard user={user} /></>;
  }

  if (user.role === "CREATOR") {
    return <>{logoutBar}<CreatorDashboard user={user} /></>;
  }

  return <>{logoutBar}<UserPrompt /></>;
}

// ── Loading ──────────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground gap-2">
      <Loader2 className="size-5 animate-spin" />
      <span>Loading dashboard…</span>
    </div>
  );
}

// ── User Prompt ──────────────────────────────────────────────────────────────

function UserPrompt() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl">You're in as a viewer</h1>
      <p className="mt-3 text-muted-foreground">
        To submit apps and see analytics, you need a Creator account. Sign out and register fresh, or contact an admin.
      </p>
      <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-5 py-2.5 font-semibold">
        Browse apps
      </Link>
    </div>
  );
}

// ── Creator Dashboard ────────────────────────────────────────────────────────

function CreatorDashboard({ user }: { user: { displayName?: string | null; email: string } }) {
  const [mode, setMode] = useState<"apps" | "analytics">("analytics");
  const queryClient = useQueryClient();

  const { data: appsPage, isLoading: appsLoading } = useQuery({
    queryKey: ["mine-apps"],
    queryFn: () => apiFetch<AppsPage>("/api/v1/apps/mine?limit=50&page=1"),
    retry: 1,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["mine-analytics"],
    queryFn: () => apiFetch<AnalyticsData>("/api/v1/apps/mine/analytics"),
    refetchInterval: 30_000,
    retry: 1,
  });

  const { data: liveData } = useQuery({
    queryKey: ["mine-live"],
    queryFn: () => apiFetch<LiveData>("/api/v1/apps/mine/live"),
    refetchInterval: 15_000,
    retry: 1,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/apps/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mine-apps"] });
      queryClient.invalidateQueries({ queryKey: ["mine-analytics"] });
      toast.success("App deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/apps/${id}/archive`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mine-apps"] });
      toast.success("App archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apps = appsPage?.items ?? [];
  const shownAnalytics = analytics;
  const shownLive = liveData ?? { activeCount: 0, recentEvents: [] };
  const name = user.displayName?.split(" ")[0] ?? user.email.split("@")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {apps.length} app{apps.length !== 1 ? "s" : ""} tracked
          </p>
          <h1 className="font-display text-3xl sm:text-4xl mt-0.5">
            Hey {name}, here's how it's going.
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Mode toggle pill */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-full p-1">
            <button
              onClick={() => setMode("analytics")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                mode === "analytics"
                  ? "bg-primary text-foreground shadow-sm"
                  : "text-foreground/55 hover:text-foreground"
              }`}
            >
              <TrendingUp className="size-3.5" /> Analytics
            </button>
            <button
              onClick={() => setMode("apps")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                mode === "apps"
                  ? "bg-primary text-foreground shadow-sm"
                  : "text-foreground/55 hover:text-foreground"
              }`}
            >
              <Rocket className="size-3.5" /> Apps
            </button>
          </div>
          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:-translate-y-0.5 transition"
          >
            <Plus className="size-3.5" /> New app
          </Link>
        </div>
      </div>

      {mode === "analytics" ? (
        <AnalyticsView analytics={shownAnalytics} loading={analyticsLoading && !analyticsError} live={shownLive} />
      ) : (
        <div className="mt-8">
          <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
            {appsLoading && !appsError && (
              <div className="p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            )}
            {(!appsLoading || appsError) && apps.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                <p>No apps yet.</p>
                <Link to="/submit" className="mt-3 inline-block font-medium hover:underline">Submit your first app →</Link>
              </div>
            )}
            {apps.map((app) => (
              <AppRow
                key={app.id}
                app={app}
                onDelete={() => { if (confirm(`Delete "${app.name}"?`)) deleteMutation.mutate(app.id); }}
                onArchive={() => { if (confirm(`Archive "${app.name}"? It will be hidden from public listings.`)) archiveMutation.mutate(app.id); }}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === app.id}
                isArchiving={archiveMutation.isPending && archiveMutation.variables === app.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── App Row ──────────────────────────────────────────────────────────────────

function AppRow({ app, onDelete, onArchive, isDeleting, isArchiving }: {
  app: AppData;
  onDelete: () => void;
  onArchive: () => void;
  isDeleting: boolean;
  isArchiving: boolean;
}) {
  const canArchive = app.status === "PUBLISHED";

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition">
      <div className="size-12 rounded-2xl bg-muted grid place-items-center overflow-hidden shrink-0">
        {app.iconUrl
          ? <img src={app.iconUrl} className="size-8 rounded" alt="" />
          : <Rocket className="size-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-lg truncate">{app.name}</div>
        <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
          <StatusBadge status={app.status} />
          <span>·</span>
          <span>{app.tagline}</span>
        </div>
      </div>
      {app.launchUrl && (
        <a href={app.launchUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
          <ExternalLink className="size-4" />
        </a>
      )}
      {canArchive && (
        <button
          onClick={onArchive}
          disabled={isArchiving}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-yellow-600"
          title="Archive (hide from public)"
        >
          {isArchiving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
        </button>
      )}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        title="Delete permanently"
      >
        {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PUBLISHED:  "text-green-600 bg-green-50",
    DRAFT:      "text-muted-foreground bg-muted",
    SUBMITTED:  "text-yellow-700 bg-yellow-50",
    IN_REVIEW:  "text-blue-600 bg-blue-50",
    APPROVED:   "text-blue-600 bg-blue-50",
    REJECTED:   "text-red-600 bg-red-50",
    ARCHIVED:   "text-red-600 bg-red-50",
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${colors[status] ?? "text-muted-foreground bg-muted"}`}>
      {status}
    </span>
  );
}

// ── Analytics View ───────────────────────────────────────────────────────────

const PERIODS = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
] as const;
type Period = typeof PERIODS[number]["label"];

function AnalyticsView({ analytics, loading, live }: { analytics: AnalyticsData | undefined; loading: boolean; live?: LiveData }) {
  const [period, setPeriod] = useState<Period>("30d");
  const periodDays = PERIODS.find(p => p.label === period)!.days;

  const totalViews = useMemo(() =>
    analytics ? Object.values(analytics.totals).reduce((a, b) => a + b, 0) : 0,
    [analytics]
  );

  const combinedSeries = useMemo(() => {
    const days: string[] = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    if (!analytics) return days.map(() => 0);
    return days.map(date =>
      Object.values(analytics.byApp).reduce((sum, series) => {
        const row = series.find(s => s.date === date);
        return sum + (row?.views ?? 0);
      }, 0)
    );
  }, [analytics, periodDays]);

  const periodViews = combinedSeries.reduce((a, b) => a + b, 0);

  if (loading) return (
    <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground py-20">
      <Loader2 className="size-5 animate-spin" /> Loading analytics…
    </div>
  );

  const apps = analytics?.apps ?? [];
  const totals = analytics?.totals ?? {};
  const maxTotal = Math.max(...apps.map(a => totals[a.id] ?? 0), 1);

  return (
    <div className="mt-8 space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Eye className="size-5" />} label="Total views" value={totalViews} tone="mint" />
        <StatCard icon={<Activity className="size-5" />} label="Last 30 days" value={periodViews} tone="primary" />
        <StatCard icon={<Rocket className="size-5" />} label="Apps live" value={apps.filter(a => a.status === "PUBLISHED").length} tone="default" />
        <StatCard
          icon={
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 rounded-full bg-mint animate-ping opacity-75" />
              <span className="relative rounded-full bg-mint size-2.5" />
            </span>
          }
          label="Live now"
          value={live?.activeCount ?? 0}
          tone="default"
        />
      </div>

      {/* Traffic chart */}
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-xl">Traffic</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily visits across all tools</p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            {PERIODS.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriod(p.label)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  period === p.label
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {periodViews === 0 ? (
          <div className="text-muted-foreground text-sm py-10 text-center">
            No traffic yet. Visits appear here as users discover your apps.
          </div>
        ) : (
          <BigChart series={combinedSeries} />
        )}
      </div>

      {/* Tool performance + Live feed side by side on desktop */}
      <div className="grid sm:grid-cols-[1fr,320px] gap-4">
        {/* Tool performance */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg">Tool performance</h3>
            <span className="text-xs text-muted-foreground">Click to view public page</span>
          </div>
          {apps.length === 0 ? (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">No apps tracked yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {apps.map(app => {
                const views = totals[app.id] ?? 0;
                const pct = Math.round((views / maxTotal) * 100);
                return (
                  <div key={app.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition group">
                    <div className="size-9 rounded-xl bg-muted grid place-items-center shrink-0 overflow-hidden">
                      {app.iconUrl
                        ? <img src={app.iconUrl} className="size-5 rounded" alt="" />
                        : <Rocket className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{app.name}</span>
                        <span className="text-sm tabular-nums text-muted-foreground shrink-0">{views.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-mint transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {app.launchUrl && (
                      <a
                        href={app.launchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live feed */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-mint animate-ping opacity-60" />
                <span className="relative rounded-full bg-mint size-2" />
              </span>
              <h3 className="font-display text-lg">Live now</h3>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Radio className="size-3" /> 15s
            </span>
          </div>
          {!live || live.recentEvents.length === 0 ? (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">No visitors in the last 5 minutes.</div>
          ) : (
            <div className="divide-y divide-border">
              {live.recentEvents.map(ev => (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="size-7 rounded-lg bg-muted grid place-items-center shrink-0 overflow-hidden">
                    {ev.app.iconUrl
                      ? <img src={ev.app.iconUrl} className="size-4 rounded" alt="" />
                      : <Rocket className="size-3.5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate block">{ev.app.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {timeAgo(ev.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Admin Dashboard ──────────────────────────────────────────────────────────

type AdminApp = {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  launchUrl: string | null;
  iconUrl: string | null;
  status: string;
  createdAt: string;
  creator: { displayName: string; user: { email: string } } | null;
};

function AdminDashboard({ user }: { user: { email: string; displayName?: string | null; role: string } }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"apps" | "users">("apps");

  const { data: allAppsPage, isLoading: allAppsLoading, refetch } = useQuery({
    queryKey: ["admin-all-apps"],
    queryFn: () => apiFetch<{ items: AdminApp[]; total: number }>("/api/v1/apps/admin?limit=100&page=1"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/apps/${id}/force`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-apps"] }); toast.success("App permanently deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/apps/${id}/archive`, { method: "POST" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-apps"] }); toast.success("App hidden for inspection"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const apps = allAppsPage?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-xs font-bold tracking-wide uppercase mb-2">
            <Shield className="size-3.5" /> {user.role}
          </div>
          <h1 className="font-display text-4xl">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Logged in as {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <RefreshCw className="size-4" />
          </button>
          <Link to="/submit" className="inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-5 py-2.5 font-semibold">
            <Plus className="size-4" /> Submit app
          </Link>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-border">
        {(["apps", "users"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition border-b-2 -mb-px ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "apps" ? `All Apps (${apps.length})` : "User Management"}
          </button>
        ))}
      </div>

      {tab === "apps" && (
        <div className="mt-6">
          {allAppsLoading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-20">
              <Loader2 className="size-5 animate-spin" /> Loading…
            </div>
          )}
          <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
            {!allAppsLoading && apps.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">No apps found.</div>
            )}
            {apps.map((app: AdminApp) => {
              const canArchive = ["PUBLISHED", "SUBMITTED", "IN_REVIEW", "APPROVED"].includes(app.status);
              return (
                <div key={app.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition">
                  <div className="size-12 rounded-2xl bg-muted grid place-items-center shrink-0 overflow-hidden">
                    {app.iconUrl
                      ? <img src={app.iconUrl} className="size-8 rounded" alt="" />
                      : <Rocket className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate">{app.name}</div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      <StatusBadge status={app.status} />
                      <span>·</span>
                      <span>{app.creator?.user?.email ?? "no creator"}</span>
                    </div>
                    {app.launchUrl && (
                      <div className="text-xs text-blue-500 truncate">{app.launchUrl}</div>
                    )}
                  </div>
                  {app.launchUrl && (
                    <a href={app.launchUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                  {canArchive && (
                    <button
                      onClick={() => { if (confirm(`Hide "${app.name}" for inspection?`)) archiveMutation.mutate(app.id); }}
                      disabled={archiveMutation.isPending && archiveMutation.variables === app.id}
                      className="p-2 rounded-lg hover:bg-yellow-50 text-muted-foreground hover:text-yellow-700"
                      title="Hide for inspection"
                    >
                      {archiveMutation.isPending && archiveMutation.variables === app.id
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Archive className="size-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`PERMANENTLY delete "${app.name}"? This cannot be undone.`)) deleteMutation.mutate(app.id); }}
                    disabled={deleteMutation.isPending && deleteMutation.variables === app.id}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Delete permanently"
                  >
                    {deleteMutation.isPending && deleteMutation.variables === app.id
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Trash2 className="size-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "users" && <UserManagementPanel />}
    </div>
  );
}

// ── User Management ──────────────────────────────────────────────────────────

function UserManagementPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSetRole = async () => {
    if (!email.trim()) { setResult({ ok: false, msg: "Enter an email address." }); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await apiFetch<{ email: string; role: string }>("/api/v1/users/admin/set-role", {
        method: "POST",
        body: { email: email.trim().toLowerCase(), role },
      });
      setResult({ ok: true, msg: `Done — ${data.email} is now ${data.role}` });
      toast.success(`Role updated for ${data.email}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update role";
      setResult({ ok: false, msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-card border border-border rounded-3xl p-6">
        <h3 className="font-display text-xl mb-1">Set User Role</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Grant or change any user's role. To promote yourself to ADMIN, enter your own email.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSetRole()}
              placeholder="user@example.com"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="CREATOR">CREATOR</option>
              <option value="USER">USER</option>
            </select>
          </div>
          <button
            onClick={handleSetRole}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground text-background px-5 py-2 text-sm font-semibold hover:bg-foreground/90 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
            Set Role
          </button>
        </div>
        {result && (
          <p className={`mt-3 text-sm font-medium ${result.ok ? "text-green-600" : "text-destructive"}`}>
            {result.msg}
          </p>
        )}
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-3xl p-6">
        <h3 className="font-semibold text-amber-900 mb-1">Bootstrap Note</h3>
        <p className="text-sm text-amber-800">
          This panel only works if you already have ADMIN role. To grant yourself admin access for the first time,
          go to <a href="https://api.imaginehq.services/admin-dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">the server admin panel</a> and
          use the "User Management" section there (requires the ADMIN_PANEL_SECRET from Railway variables).
        </p>
      </div>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "mint" | "default" }) {
  const bg = tone === "primary" ? "bg-primary-soft" : tone === "mint" ? "bg-mint-soft" : "bg-card";
  return (
    <div className={`${bg} border border-border rounded-3xl p-5`}>
      <div className="flex items-center gap-2 text-foreground/70 text-sm font-semibold">
        <span>{icon}</span> {label}
      </div>
      <div className="mt-2 font-display text-4xl">{value}</div>
    </div>
  );
}

// ── Chart ────────────────────────────────────────────────────────────────────

function BigChart({ series }: { series: number[] }) {
  const w = 720, h = 200;
  const max = Math.max(...series, 1);
  const min = Math.min(...series);
  const stepX = w / Math.max(series.length - 1, 1);
  const points = series.map((v, i) => [i * stepX, h - ((v - min) / (max - min || 1)) * (h - 20) - 10] as const);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="mt-2 -mx-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44" preserveAspectRatio="none">
        <defs>
          <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.13 168)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.78 0.13 168)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(g => (
          <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 6" />
        ))}
        <path d={area} fill="url(#af)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.13 168)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.length > 0 && (
          <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="4" fill="oklch(0.78 0.13 168)" />
        )}
      </svg>
    </div>
  );
}

