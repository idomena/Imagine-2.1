import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Rocket, Trash2, ExternalLink, Plus, TrendingUp, Eye,
  Activity, Archive, Loader2, Shield, RefreshCw, Radio,
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
  apps: Array<{ id: string; name: string; slug: string; iconUrl: string | null; status: string; launchUrl: string | null }>;
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
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <LoadingState />;
  if (!isAuthenticated || !user) return null;

  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    return <AdminDashboard user={user} />;
  }

  if (user.role === "CREATOR") {
    return <CreatorDashboard user={user} />;
  }

  return <UserPrompt />;
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
  const [mode, setMode] = useState<"apps" | "analytics">("apps");
  const queryClient = useQueryClient();

  const { data: appsPage, isLoading: appsLoading } = useQuery({
    queryKey: ["mine-apps"],
    queryFn: () => apiFetch<AppsPage>("/api/v1/apps/mine?limit=50&page=1"),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["mine-analytics"],
    queryFn: () => apiFetch<AnalyticsData>("/api/v1/apps/mine/analytics"),
    enabled: mode === "analytics",
    refetchInterval: mode === "analytics" ? 30_000 : false,
  });

  const { data: liveData } = useQuery({
    queryKey: ["mine-live"],
    queryFn: () => apiFetch<LiveData>("/api/v1/apps/mine/live"),
    enabled: mode === "analytics",
    refetchInterval: mode === "analytics" ? 15_000 : false,
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
  const name = user.displayName?.split(" ")[0] ?? user.email.split("@")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Welcome back, {name}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your apps and track performance.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMode(mode === "apps" ? "analytics" : "apps")}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 sm:px-4 py-2 text-sm font-semibold hover:bg-muted/40 transition"
          >
            {mode === "apps" ? <><TrendingUp className="size-4" /> Analytics</> : <><Rocket className="size-4" /> Apps</>}
          </button>
          <Link to="/submit" className="inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold hover:-translate-y-0.5 transition">
            <Plus className="size-4" /> New app
          </Link>
        </div>
      </div>

      {mode === "apps" ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard icon={<Rocket className="size-5" />} label="Apps" value={apps.length} tone="primary" />
            <StatCard icon={<Eye className="size-5" />} label="Published" value={apps.filter(a => a.status === "PUBLISHED").length} tone="mint" />
            <StatCard icon={<Activity className="size-5" />} label="In review" value={apps.filter(a => ["SUBMITTED", "IN_REVIEW", "APPROVED"].includes(a.status)).length} tone="default" />
          </div>

          <h2 className="mt-10 font-display text-2xl">Your apps</h2>
          <div className="mt-3 bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
            {appsLoading && (
              <div className="p-10 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            )}
            {!appsLoading && apps.length === 0 && (
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
        </>
      ) : (
        <AnalyticsView analytics={analytics} loading={analyticsLoading} live={liveData} />
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

function AnalyticsView({ analytics, loading, live }: { analytics: AnalyticsData | undefined; loading: boolean; live?: LiveData }) {
  const totalViews = useMemo(() =>
    analytics ? Object.values(analytics.totals).reduce((a, b) => a + b, 0) : 0,
    [analytics]
  );

  const combinedSeries = useMemo(() => {
    if (!analytics) return new Array(30).fill(0);
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days.map(date =>
      Object.values(analytics.byApp).reduce((sum, series) => {
        const row = series.find(s => s.date === date);
        return sum + (row?.views ?? 0);
      }, 0)
    );
  }, [analytics]);

  if (loading) return (
    <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground py-20">
      <Loader2 className="size-5 animate-spin" /> Loading analytics…
    </div>
  );

  const apps = analytics?.apps ?? [];
  const totals = analytics?.totals ?? {};

  return (
    <div className="bg-foreground text-background -mx-4 px-4 py-10 mt-6 rounded-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-mint/15 text-mint px-3 py-1 text-xs font-bold tracking-wide uppercase">
            <Activity className="size-3.5" /> Live analytics · Last 30 days
          </div>
          <h2 className="mt-3 font-display text-4xl text-background">Traffic overview</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-background/5 border border-background/10 p-5">
          <div className="text-xs text-background/60 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Eye className="size-4 text-mint" /> Total views
          </div>
          <div className="mt-2 font-display text-4xl text-background">{totalViews.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl bg-background/5 border border-background/10 p-5">
          <div className="text-xs text-background/60 font-semibold uppercase tracking-wider flex items-center gap-2">
            <Rocket className="size-4 text-mint" /> Apps tracked
          </div>
          <div className="mt-2 font-display text-4xl text-background">{apps.length}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-background/5 border border-background/10 p-6 mb-6">
        <h3 className="font-display text-xl text-background mb-4">Daily visits</h3>
        {totalViews === 0 ? (
          <div className="text-background/40 text-sm py-8 text-center">
            No traffic data yet. Visits appear here as users discover your apps.
          </div>
        ) : (
          <BigChart series={combinedSeries} />
        )}
      </div>

      {apps.length > 0 && (
        <div className="rounded-2xl bg-background/5 border border-background/10 overflow-hidden">
          <div className="p-6">
            <h3 className="font-display text-xl text-background">Per-app performance</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-background/50 border-y border-background/10">
              <tr>
                <th className="text-left px-6 py-3">App</th>
                <th className="text-right px-6 py-3">Views (30d)</th>
                <th className="text-right px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map(app => (
                <tr key={app.id} className="border-t border-background/10 hover:bg-background/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-background/10 grid place-items-center shrink-0">
                        {app.iconUrl
                          ? <img src={app.iconUrl} className="size-5 rounded" alt="" />
                          : <Rocket className="size-4 text-background/40" />}
                      </div>
                      <div>
                        <div className="font-semibold text-background">{app.name}</div>
                        <div className="text-xs text-background/40">{app.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-background tabular-nums">
                    {(totals[app.id] ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold text-background/60">{app.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Live feed */}
      <div className="mt-3 rounded-2xl bg-background/5 border border-background/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inset-0 rounded-full bg-mint animate-ping opacity-60" />
              <span className="relative rounded-full bg-mint size-2.5" />
            </span>
            <h3 className="font-display text-xl text-background">Live now</h3>
            <span className="text-background/50 text-sm">· {live?.activeCount ?? 0} visits in last 5 min</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-background/40">
            <Radio className="size-3" /> auto-refresh 15s
          </div>
        </div>
        {!live || live.recentEvents.length === 0 ? (
          <p className="text-background/40 text-sm py-4 text-center">No visits yet in the last 5 minutes.</p>
        ) : (
          <div className="space-y-2">
            {live.recentEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-background/5 last:border-0">
                <div className="size-7 rounded-lg bg-background/10 grid place-items-center shrink-0 overflow-hidden">
                  {ev.app.iconUrl
                    ? <img src={ev.app.iconUrl} className="size-5 rounded" alt="" />
                    : <Rocket className="size-3.5 text-background/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-background/60 text-sm">visited </span>
                  <span className="text-background text-sm font-semibold">{ev.app.name}</span>
                </div>
                <span className="text-xs text-background/30 tabular-nums shrink-0">
                  {timeAgo(ev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
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

