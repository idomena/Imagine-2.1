import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUp,
  ExternalLink,
  Share2,
  Calendar,
  ChevronRight,
  Star,
  Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, API_BASE_URL } from "@/lib/api";

export const Route = createFileRoute("/tool/$toolId")({
  component: ToolDetail,
});

type ApiApp = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  launchUrl: string | null;
  iconUrl: string | null;
  primaryColor: string | null;
  categoryId: string | null;
  createdAt: string;
  publishedAt: string | null;
  creator?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    user?: { email: string };
  };
  category?: { id: string; name: string; slug: string } | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  appReviews?: Array<{
    id: string;
    rating: number;
    body: string | null;
    createdAt: string;
    user?: { id: string; email: string; displayName?: string | null; avatarUrl?: string | null };
  }>;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

function ToolDetail() {
  const { toolId } = Route.useParams();

  const { data: app, isLoading, error } = useQuery<ApiApp>({
    queryKey: ["app", toolId],
    queryFn: () => apiFetch<ApiApp>(`/api/v1/apps/${toolId}`),
    staleTime: 60_000,
  });

  // Track page view for analytics — fire-and-forget
  useEffect(() => {
    if (!toolId) return;
    fetch(`${API_BASE_URL}/api/v1/apps/${toolId}/view`, { method: "POST" }).catch(() => {});
  }, [toolId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 flex justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Tool not found</h1>
        <Link to="/" className="mt-4 inline-block text-mint hover:underline">← Back to discover</Link>
      </div>
    );
  }

  const avgRating = app.appReviews?.length
    ? app.appReviews.reduce((a, r) => a + r.rating, 0) / app.appReviews.length
    : 0;
  const coverColor = app.primaryColor ?? "#14b8a6";
  const creatorName = app.creator?.displayName ?? app.creator?.user?.email ?? "Unknown maker";
  const reviews = app.appReviews ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 pb-44 md:pb-32">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link to="/trending" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{app.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticker">
        <div className="flex items-start gap-4">
          <div
            className="size-20 rounded-2xl grid place-items-center sticker shrink-0"
            style={{ backgroundColor: coverColor }}
          >
            {app.iconUrl && (
              <img
                src={app.iconUrl}
                alt=""
                className="size-10 rounded"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-none">{app.name}</h1>
            <p className="text-foreground/70 mt-2 text-lg leading-snug">{app.tagline}</p>
            <div className="mt-4 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
              {app.category && (
                <span className="px-2.5 py-1 rounded-full bg-mint-soft text-foreground/80 font-medium">
                  {app.category.name}
                </span>
              )}
              {app.tags?.map((t) => (
                <span key={t.id} className="px-2.5 py-1 rounded-full bg-muted">#{t.name}</span>
              ))}
              <span className="flex items-center gap-1 ml-1">
                <Calendar className="size-3" /> {timeAgo(app.createdAt)} ago
              </span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-soft text-foreground font-semibold">
                  <Star className="size-3 fill-foreground" /> {avgRating.toFixed(1)} · {reviews.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="mt-8">
        <h2 className="font-display text-3xl">About {app.name}</h2>
        <p className="mt-3 text-foreground/80 leading-relaxed whitespace-pre-line">{app.description}</p>
      </div>

      {/* Maker card */}
      {app.creator && (
        <div className="mt-8 bg-card border border-border rounded-3xl p-5 sticker">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              {app.creator.avatarUrl ? (
                <img
                  src={app.creator.avatarUrl}
                  alt={creatorName}
                  className="size-12 rounded-2xl object-cover sticker"
                />
              ) : (
                <div
                  className="size-12 rounded-2xl grid place-items-center sticker text-white font-bold text-lg"
                  style={{
                    background: `oklch(0.65 0.18 ${creatorName.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360})`,
                  }}
                >
                  {creatorName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{creatorName}</div>
              <div className="text-xs text-muted-foreground">Maker</div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-3xl flex items-center gap-2">
            <Star className="size-6 text-mint" /> Reviews · {reviews.length}
          </h2>
          <div className="mt-5 space-y-3">
            {reviews.map((r) => {
              const name = r.user?.displayName ?? r.user?.email ?? "User";
              const hue = name.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
              return (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {r.user?.avatarUrl ? (
                      <img src={r.user.avatarUrl} alt={name} className="size-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="size-10 rounded-full grid place-items-center text-white font-semibold text-sm shrink-0 sticker"
                        style={{ background: `oklch(0.65 0.18 ${hue})` }}
                      >
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{name}</span>
                        <div className="inline-flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`size-3.5 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
                              strokeWidth={2}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)} ago</span>
                      </div>
                      {r.body && (
                        <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">{r.body}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
        <div className="mx-auto max-w-2xl flex items-center gap-2 pointer-events-auto">
          {app.launchUrl && (
            <a
              href={`${API_BASE_URL}/api/v1/apps/${app.id}/visit`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-1 inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              style={{
                background: "oklch(0.22 0.03 60)",
                boxShadow: "0 1px 0 oklch(1 1 1 / 0.08) inset, 0 0 0 1px oklch(0.22 0.03 60), 0 10px 30px -8px oklch(0.22 0.03 60 / 0.5)",
              }}
            >
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "radial-gradient(120% 80% at 20% 0%, oklch(0.85 0.18 85 / 0.35), transparent 60%), radial-gradient(120% 80% at 100% 100%, oklch(0.7 0.18 168 / 0.35), transparent 60%)",
                }}
              />
              <span
                className="relative italic text-[1.1rem] sm:text-[1.35rem] leading-none text-[oklch(0.97_0.02_85)] tracking-tight whitespace-nowrap"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Visit website
              </span>
              <span
                aria-hidden
                className="relative grid place-items-center size-7 rounded-full bg-[oklch(0.85_0.18_85)] text-[oklch(0.22_0.03_60)] transition-transform duration-300 group-hover:rotate-45"
              >
                <ArrowUp className="size-3.5 rotate-45" strokeWidth={3} />
              </span>
            </a>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
            }}
            className="shrink-0 grid place-items-center size-12 rounded-full bg-card sticker hover:-translate-y-0.5 transition"
            aria-label="Share"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
