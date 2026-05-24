import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Rocket,
  ArrowUp,
  MessageCircle,
  Trash2,
  ExternalLink,
  Plus,
  TrendingUp,
  Eye,
  MousePointerClick,
  Users,
  Globe,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { actions, useStore, timeAgo } from "@/lib/store";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalyticsOverview, type AnalyticsRange } from "@/hooks/use-analytics";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { mode } = useStore();
  return mode === "founder" ? <FounderDashboard /> : <UserDashboard />;
}

/* ============================================================ */
/*  USER (maker) DASHBOARD — friendly, cozy                     */
/* ============================================================ */

function UserDashboard() {
  const { tools, comments, currentUserId, users } = useStore();
  const me = users.find((u) => u.id === currentUserId)!;
  const mine = tools
    .filter((t) => t.makerId === currentUserId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const totalUp = mine.reduce((a, t) => a + t.upvotes, 0);
  const totalComments = comments.filter((c) => mine.some((t) => t.id === c.toolId)).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl">Welcome back, {me.name.split(" ")[0]} 🌱</h1>
          <p className="text-muted-foreground mt-1">Track your tools, upvotes, and conversations.</p>
        </div>
        <Link to="/submit" className="inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-5 py-2.5 font-semibold sticker hover:-translate-y-0.5 transition">
          <Plus className="size-4" /> New tool
        </Link>
      </div>

      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <StatCard icon={<Rocket className="size-5" />} label="Tools submitted" value={mine.length} tone="primary" />
        <StatCard icon={<ArrowUp className="size-5" />} label="Total upvotes" value={totalUp} tone="mint" />
        <StatCard icon={<MessageCircle className="size-5" />} label="Comments received" value={totalComments} tone="default" />
      </div>

      <h2 className="mt-10 font-display text-2xl">Your tools</h2>
      <div className="mt-3 bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden sticker">
        {mine.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <p>You haven't planted any tools yet.</p>
            <Link to="/submit" className="mt-3 inline-block text-mint font-medium hover:underline">Submit your first tool →</Link>
          </div>
        )}
        {mine.map((t) => {
          const c = comments.filter((x) => x.toolId === t.id).length;
          return (
            <div key={t.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition">
              <Link to="/tool/$toolId" params={{ toolId: t.id }} className="shrink-0">
                <div className="size-12 rounded-2xl grid place-items-center sticker" style={{ backgroundColor: t.coverColor }}>
                  <img src={t.faviconUrl} className="size-6 rounded" alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to="/tool/$toolId" params={{ toolId: t.id }} className="font-display text-lg hover:text-mint truncate block">{t.name}</Link>
                <div className="text-xs text-muted-foreground truncate">{t.tagline} · {timeAgo(t.createdAt)} ago</div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><ArrowUp className="size-3.5 text-mint" /> {t.upvotes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="size-3.5" /> {c}</span>
              </div>
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-mint">
                <ExternalLink className="size-4" />
              </a>
              <button
                onClick={() => {
                  if (confirm(`Delete "${t.name}"?`)) {
                    actions.deleteTool(t.id);
                    toast.success("Tool deleted");
                  }
                }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl border border-dashed border-border p-6 text-center bg-mint-soft/40">
        <p className="text-sm">
          Want traffic, clicks, referrers, and conversion charts?{" "}
          <button
            onClick={() => {
              actions.setMode("founder");
              toast.success("Founder mode on ✨");
            }}
            className="font-semibold text-mint hover:underline"
          >
            Switch to Founder mode →
          </button>
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "mint" | "default" }) {
  const bg = tone === "primary" ? "bg-primary-soft" : tone === "mint" ? "bg-mint-soft" : "bg-card";
  return (
    <div className={`${bg} border border-border rounded-3xl p-5 sticker`}>
      <div className="flex items-center gap-2 text-foreground/70 text-sm font-semibold">
        <span>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-4xl">{value}</div>
    </div>
  );
}

/* ============================================================ */
/*  FOUNDER DASHBOARD — dark, dense, analytics-grade            */
/* ============================================================ */

function FounderDashboard() {
  const { users, currentUserId } = useStore();
  const me = users.find((u) => u.id === currentUserId)!;
  const { isAuthenticated } = useAuth();
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnalyticsOverview(range);

  return (
    <div className="bg-foreground text-background min-h-[calc(100vh-4rem)] -mt-px">
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-mint/15 text-mint px-3 py-1 text-xs font-bold tracking-wide uppercase">
              <Activity className="size-3.5" />
              Founder mode · {isFetching ? "Updating…" : "Live"}
            </div>
            <h1 className="mt-3 font-display text-5xl text-background">
              Hey {me.name.split(" ")[0]}, here's how it's going.
            </h1>
            <p className="text-background/60 mt-1">
              {range === "7d" ? "Last 7 days" : range === "90d" ? "Last 90 days" : "Last 30 days"}
              {data ? ` · ${data.tools.length} tools tracked` : ""}
            </p>
          </div>
          <button
            onClick={() => {
              actions.setMode("user");
              toast("Back to user mode");
            }}
            className="text-xs font-semibold rounded-full bg-background/10 hover:bg-background/20 px-4 py-2 transition"
          >
            ← Back to user mode
          </button>
        </div>

        {!isAuthenticated && (
          <DashState
            icon={<AlertTriangle className="size-5" />}
            title="Sign in to see your live analytics"
            body="Your dashboard needs an authenticated session to read live data from your backend."
            action={
              <Link to="/login" className="rounded-full bg-mint text-mint-foreground px-4 py-2 text-xs font-bold">
                Log in
              </Link>
            }
          />
        )}

        {isAuthenticated && isLoading && (
          <DashState icon={<Loader2 className="size-5 animate-spin" />} title="Loading live analytics…" />
        )}

        {isAuthenticated && isError && (
          <DashState
            icon={<AlertTriangle className="size-5 text-destructive" />}
            title="Couldn't load analytics"
            body={(error as Error)?.message ?? "Your backend didn't respond."}
            action={
              <button
                onClick={() => refetch()}
                className="rounded-full bg-background/10 hover:bg-background/20 px-4 py-2 text-xs font-semibold"
              >
                Retry
              </button>
            }
          />
        )}

        {isAuthenticated && data && (
          <>
            {/* KPI cards */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPI icon={<Eye className="size-4" />} label="Views" value={data.totals.views.toLocaleString()} />
              <KPI icon={<MousePointerClick className="size-4" />} label="Outbound clicks" value={data.totals.clicks.toLocaleString()} />
              <KPI icon={<TrendingUp className="size-4" />} label="Avg CTR" value={`${data.totals.ctr.toFixed(1)}%`} />
              <KPI icon={<MessageCircle className="size-4" />} label="Conversations" value={data.totals.conversations.toString()} />
            </div>

            {/* Main chart + sources */}
            <div className="mt-6 grid lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 rounded-3xl bg-background/5 border border-background/10 p-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="font-display text-2xl text-background">Traffic</h2>
                    <p className="text-xs text-background/60">Daily views across all your tools</p>
                  </div>
                  <div className="flex gap-1 text-xs">
                    {(["7d", "30d", "90d"] as AnalyticsRange[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-2.5 py-1 rounded-full font-semibold ${r === range ? "bg-mint text-mint-foreground" : "bg-background/10 text-background/70 hover:bg-background/20"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {data.series.length > 0 ? (
                  <BigChart series={data.series} />
                ) : (
                  <p className="text-sm text-background/60 mt-8">No traffic data yet.</p>
                )}
              </div>

              <div className="rounded-3xl bg-background/5 border border-background/10 p-6">
                <h2 className="font-display text-2xl text-background">Top sources</h2>
                <p className="text-xs text-background/60">Where visitors come from</p>
                <div className="mt-5 space-y-3">
                  {data.sources.length === 0 && (
                    <p className="text-sm text-background/60">No referrer data yet.</p>
                  )}
                  {data.sources.map((s) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-2 text-background">
                          <span className="size-2.5 rounded-full" style={{ background: s.color ?? "var(--mint)" }} />
                          {s.name}
                        </span>
                        <span className="text-background/60">{s.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-background/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.value * 2.3)}%`, background: s.color ?? "var(--mint)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Per-tool table */}
            <div className="mt-6 rounded-3xl bg-background/5 border border-background/10 overflow-hidden">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl text-background">Tool performance</h2>
                  <p className="text-xs text-background/60">Click a row to open the public page</p>
                </div>
                <Link to="/submit" className="inline-flex items-center gap-1.5 rounded-full bg-mint text-mint-foreground px-3 py-1.5 text-xs font-bold hover:-translate-y-0.5 transition">
                  <Plus className="size-3.5" /> New tool
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-wider text-background/50 border-y border-background/10">
                    <tr>
                      <th className="text-left font-semibold px-6 py-3">Tool</th>
                      <th className="text-left font-semibold px-2 py-3 w-32">Trend</th>
                      <th className="text-right font-semibold px-3 py-3">Views</th>
                      <th className="text-right font-semibold px-3 py-3">Clicks</th>
                      <th className="text-right font-semibold px-3 py-3">CTR</th>
                      <th className="text-right font-semibold px-3 py-3">Δ</th>
                      <th className="text-right font-semibold px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tools.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-background/60">
                          No tools yet.{" "}
                          <Link to="/submit" className="text-mint font-semibold hover:underline">
                            Ship your first one →
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      data.tools.map((p) => (
                        <tr key={p.id} className="border-t border-background/10 hover:bg-background/5 transition">
                          <td className="px-6 py-4">
                            <Link to="/tool/$toolId" params={{ toolId: p.id }} className="flex items-center gap-3">
                              <div className="size-9 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: p.primaryColor ?? "oklch(0.78 0.14 175)" }}>
                                {p.iconUrl && (
                                  <img src={p.iconUrl} className="size-5 rounded" alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-background truncate">{p.name}</div>
                                <div className="text-xs text-background/50 truncate">{p.domain}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="px-2 py-4">
                            <Sparkline series={p.series} />
                          </td>
                          <td className="px-3 py-4 text-right text-background tabular-nums">{p.views.toLocaleString()}</td>
                          <td className="px-3 py-4 text-right text-background tabular-nums">{p.clicks.toLocaleString()}</td>
                          <td className="px-3 py-4 text-right text-background tabular-nums">{p.ctr.toFixed(1)}%</td>
                          <td className={`px-3 py-4 text-right font-semibold tabular-nums ${p.trend >= 0 ? "text-mint" : "text-destructive"}`}>
                            <span className="inline-flex items-center gap-0.5">
                              {p.trend >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                              {Math.abs(p.trend).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex p-1.5 rounded-lg hover:bg-background/10 text-background/60 hover:text-background">
                              <ExternalLink className="size-4" />
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom row: live visitors + countries */}
            <div className="mt-6 grid lg:grid-cols-2 gap-3">
              <div className="rounded-3xl bg-background/5 border border-background/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl text-background flex items-center gap-2">
                      <span className="relative flex size-2.5">
                        <span className="absolute inset-0 rounded-full bg-mint animate-ping opacity-60" />
                        <span className="relative rounded-full bg-mint size-2.5" />
                      </span>
                      Right now
                    </h2>
                    <p className="text-xs text-background/60">{data.totals.liveVisitors} live visitors</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {data.realtime.length === 0 && (
                    <p className="text-background/60">No visitors right now.</p>
                  )}
                  {data.realtime.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-background/5 last:border-0">
                      <span className="text-base">{r.country}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-background truncate">
                          <span className="text-background/60">visited</span> {r.toolName}
                          <span className="text-background/40"> {r.page}</span>
                        </div>
                      </div>
                      <span className="text-xs text-background/40 tabular-nums">{r.time} ago</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-background/5 border border-background/10 p-6">
                <h2 className="font-display text-2xl text-background flex items-center gap-2">
                  <Globe className="size-5 text-mint" /> Top countries
                </h2>
                <p className="text-xs text-background/60">
                  {range === "7d" ? "Last 7 days" : range === "90d" ? "Last 90 days" : "Last 30 days"}
                </p>
                <div className="mt-4 space-y-2.5">
                  {data.countries.length === 0 && (
                    <p className="text-sm text-background/60">No country data yet.</p>
                  )}
                  {data.countries.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <span className="text-base w-6">{c.flag}</span>
                      <span className="text-sm text-background w-44 truncate">{c.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-background/10 overflow-hidden">
                        <div className="h-full bg-mint rounded-full" style={{ width: `${Math.min(100, c.pct * 2.5)}%` }} />
                      </div>
                      <span className="text-xs text-background/60 tabular-nums w-8 text-right">{c.pct}%</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-background/60">
                  <Users className="size-3.5" />
                  <span>{data.totals.uniqueVisitors.toLocaleString()} unique visitors.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DashState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-3xl bg-background/5 border border-background/10 p-8 flex items-start gap-4">
      <div className="text-background/80">{icon}</div>
      <div className="flex-1">
        <h3 className="font-display text-xl text-background">{title}</h3>
        {body && <p className="text-sm text-background/60 mt-1">{body}</p>}
      </div>
      {action}
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-background/5 border border-background/10 p-5">
      <div className="flex items-center gap-2 text-xs text-background/60 font-semibold uppercase tracking-wider">
        <span className="text-mint">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-4xl text-background">{value}</div>
    </div>
  );
}

function KPI({ icon, label, value, delta, positive }: { icon: React.ReactNode; label: string; value: string; delta: string; positive: boolean }) {
  return (
    <div className="rounded-3xl bg-background/5 border border-background/10 p-5">
      <div className="flex items-center gap-2 text-xs text-background/60 font-semibold uppercase tracking-wider">
        <span className="text-mint">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-4xl text-background">{value}</div>
      <div className={`mt-1 text-xs font-semibold inline-flex items-center gap-1 ${positive ? "text-mint" : "text-destructive"}`}>
        {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {delta} <span className="text-background/40 font-medium ml-1">vs prev 30d</span>
      </div>
    </div>
  );
}

function BigChart({ series }: { series: number[] }) {
  const w = 720;
  const h = 200;
  const max = Math.max(...series, 1);
  const min = Math.min(...series);
  const stepX = w / (series.length - 1);
  const points = series.map((v, i) => [i * stepX, h - ((v - min) / (max - min || 1)) * (h - 20) - 10] as const);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="mt-5 -mx-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.13 168)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="oklch(0.78 0.13 168)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 6" />
        ))}
        <path d={area} fill="url(#chartFill)" />
        <path d={path} fill="none" stroke="oklch(0.78 0.13 168)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* last point dot */}
        {points.length > 0 && (
          <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="4" fill="oklch(0.78 0.13 168)" />
        )}
      </svg>
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  const w = 110;
  const h = 28;
  const max = Math.max(...series, 1);
  const min = Math.min(...series);
  const stepX = w / (series.length - 1);
  const path = series
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-7" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="oklch(0.78 0.13 168)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
