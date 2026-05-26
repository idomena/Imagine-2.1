import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUp,
  Share2,
  Calendar,
  ChevronRight,
  Star,
  Loader2,
  Globe,
  Tag,
  MessageSquare,
  Eye,
  Send,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/tool/$toolId")({
  component: ToolDetail,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiApp = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  launchUrl: string | null;
  iconUrl: string | null;
  primaryColor: string | null;
  videoUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
  creator?: {
    id: string;
    displayName: string;
    bio: string | null;
    website: string | null;
    avatarUrl: string | null;
    verified: boolean;
    user?: { email: string };
  } | null;
  category?: { id: string; name: string; slug: string } | null;
  tags?: Array<{
    appId: string;
    tagId: string;
    tag: { id: string; name: string; slug: string };
  }>;
  assets?: Array<{
    id: string;
    type: "ICON" | "SCREENSHOT" | "PROMO_VIDEO" | "BANNER";
    url: string;
    width: number | null;
    height: number | null;
    sortOrder: number;
  }>;
  _count?: { launchEvents: number };
};

type ApiReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { id: string; email: string; avatarUrl: string | null };
};

type ReviewsResponse = {
  items: ApiReview[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  avgRating: number | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function colorAvatar(name: string): string {
  const hue = name.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return `oklch(0.65 0.18 ${hue})`;
}

function userHandle(email: string): string {
  return email.split("@")[0];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${
            n <= rating
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          }`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="size-9 grid place-items-center rounded-lg hover:bg-muted transition"
        >
          <Star
            className={`size-6 transition-colors ${
              n <= (hover || value)
                ? "fill-primary text-primary"
                : "text-muted-foreground/30"
            }`}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}

function RatingHistogram({ items }: { items: ApiReview[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: items.filter((r) => r.rating === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="space-y-2 w-full">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-right font-medium text-foreground">
            {star}
          </span>
          <Star className="size-3 shrink-0 text-muted-foreground/50" />
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-right text-muted-foreground">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function ToolDetail() {
  const { toolId } = Route.useParams();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const {
    data: app,
    isLoading,
    error,
  } = useQuery<ApiApp>({
    queryKey: ["app", toolId],
    queryFn: () => apiFetch<ApiApp>(`/api/v1/apps/${toolId}`),
    staleTime: 60_000,
  });

  const { data: reviewsData, isLoading: reviewsLoading } =
    useQuery<ReviewsResponse>({
      queryKey: ["reviews", toolId],
      queryFn: () =>
        apiFetch<ReviewsResponse>(`/api/v1/apps/${toolId}/reviews?limit=50`),
      staleTime: 30_000,
      enabled: !!toolId,
    });

  const submitReview = useMutation({
    mutationFn: (body: { rating: number; comment: string }) =>
      apiFetch(`/api/v1/apps/${toolId}/reviews`, { method: "POST", body }),
    onSuccess: () => {
      toast.success("Review submitted!");
      setReviewRating(0);
      setReviewComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", toolId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  useEffect(() => {
    if (!toolId) return;
    fetch(`${API_BASE_URL}/api/v1/track-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ projectId: toolId }),
    }).catch(() => {});
  }, [toolId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 flex justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Tool not found</h1>
        <Link to="/" className="mt-4 inline-block text-mint hover:underline">
          ← Back to discover
        </Link>
      </div>
    );
  }

  const coverColor = app.primaryColor ?? "#14b8a6";
  const creatorName =
    app.creator?.displayName || app.creator?.user?.email || "Unknown maker";
  const reviews = reviewsData?.items ?? [];
  const avgRating = reviewsData?.avgRating ?? 0;
  const reviewCount = reviewsData?.total ?? 0;
  const launchCount = app._count?.launchEvents ?? 0;
  const screenshots = (app.assets ?? []).filter(
    (a) => a.type === "SCREENSHOT"
  );
  const tags = app.tags ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10 pb-44 md:pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to="/trending" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {app.name}
        </span>
      </nav>

      {/* ── Hero card ────────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden mb-6 border border-border"
        style={{
          boxShadow: `0 0 0 1px ${coverColor}22, 0 16px 48px -8px ${coverColor}30`,
        }}
      >
        {/* Colour banner */}
        <div
          className="h-32 sm:h-44 w-full"
          style={{
            background: `linear-gradient(135deg, ${coverColor}ee 0%, ${coverColor}55 60%, ${coverColor}22 100%)`,
          }}
        />

        <div className="bg-card px-6 sm:px-8 pb-6 sm:pb-8">
          {/* Icon — overlaps banner */}
          <div className="-mt-12 mb-4">
            <div
              className="size-24 rounded-2xl grid place-items-center border-4 border-card shadow-md shrink-0"
              style={{ backgroundColor: coverColor }}
            >
              {app.iconUrl ? (
                <img
                  src={app.iconUrl}
                  alt=""
                  className="size-12 rounded-lg"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display =
                      "none")
                  }
                />
              ) : (
                <span
                  className="text-2xl font-bold text-white/90 select-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {app.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-none">
                {app.name}
              </h1>
              <p className="text-foreground/70 mt-2 text-lg leading-snug">
                {app.tagline}
              </p>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 flex-wrap text-sm">
                {reviewCount > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <StarRow rating={Math.round(avgRating)} />
                    <span className="font-semibold">{avgRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic text-sm">
                    No reviews yet
                  </span>
                )}
                {launchCount > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="size-3.5" />
                    {launchCount.toLocaleString()} visits
                  </span>
                )}
              </div>

              {/* Category + tags */}
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {app.category && (
                  <span className="px-2.5 py-1 rounded-full bg-mint-soft text-foreground/80 font-medium text-xs">
                    {app.category.name}
                  </span>
                )}
                {tags.map((t) => (
                  <span
                    key={t.tagId}
                    className="px-2.5 py-1 rounded-full bg-muted text-foreground/70 text-xs"
                  >
                    #{t.tag.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Desktop visit button */}
            {app.launchUrl && (
              <a
                href={`${API_BASE_URL}/api/v1/apps/${app.id}/visit`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: "oklch(0.22 0.03 60)",
                  color: "oklch(0.97 0.02 85)",
                }}
              >
                Visit website
                <ExternalLink className="size-3.5 opacity-70" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Screenshots ───────────────────────────────────────────────────── */}
      {screenshots.length > 0 && (
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            {screenshots.map((s) => (
              <img
                key={s.id}
                src={s.url}
                alt=""
                className="h-48 sm:h-64 w-auto rounded-2xl shrink-0 snap-start object-cover border border-border"
                style={{ maxWidth: "80vw" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 2-column layout ───────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left: About + Reviews */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* About */}
          <section>
            <h2 className="font-display text-3xl mb-3">About {app.name}</h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
              {app.description}
            </p>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="font-display text-3xl mb-5 flex items-center gap-2">
              <MessageSquare className="size-6 text-mint" />
              Reviews
              {reviewCount > 0 && (
                <span className="text-muted-foreground text-xl font-sans font-normal ml-1">
                  · {reviewCount}
                </span>
              )}
            </h2>

            {/* Rating summary card */}
            {reviewCount > 0 && !reviewsLoading && (
              <div className="bg-card border border-border rounded-2xl p-5 mb-5 flex flex-col sm:flex-row gap-5">
                <div className="text-center shrink-0 sm:pr-5 sm:border-r sm:border-border">
                  <div className="font-display text-6xl leading-none">
                    {avgRating.toFixed(1)}
                  </div>
                  <div className="mt-2">
                    <StarRow rating={Math.round(avgRating)} size="lg" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5">
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                  <RatingHistogram items={reviews} />
                </div>
              </div>
            )}

            {/* Write a review */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-5">
              <h3 className="font-semibold mb-3 flex items-center gap-1.5 text-base">
                <Star className="size-4 text-mint" />
                Write a review
              </h3>
              {isAuthenticated ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reviewRating === 0) {
                      toast.error("Please pick a rating");
                      return;
                    }
                    if (!reviewComment.trim()) {
                      toast.error("Please write a comment");
                      return;
                    }
                    submitReview.mutate({
                      rating: reviewRating,
                      comment: reviewComment.trim(),
                    });
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <StarPicker
                      value={reviewRating}
                      onChange={setReviewRating}
                    />
                    {reviewRating > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {
                          ["", "Poor", "Fair", "Good", "Great", "Excellent"][
                            reviewRating
                          ]
                        }
                      </span>
                    )}
                  </div>
                  <textarea
                    className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder="Share your experience with this tool..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    maxLength={1000}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {reviewComment.length}/1000
                    </span>
                    <button
                      type="submit"
                      disabled={submitReview.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-foreground text-background disabled:opacity-50 hover:-translate-y-0.5 transition"
                    >
                      {submitReview.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      Submit review
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link
                    to="/login"
                    className="text-mint hover:underline font-medium"
                  >
                    Sign in
                  </Link>{" "}
                  to leave a review.
                </p>
              )}
            </div>

            {/* Review list */}
            {reviewsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No reviews yet — be the first to share your experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const name = r.user ? userHandle(r.user.email) : "User";
                  return (
                    <div
                      key={r.id}
                      className="bg-card border border-border rounded-2xl p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        {r.user?.avatarUrl ? (
                          <img
                            src={r.user.avatarUrl}
                            alt={name}
                            className="size-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="size-10 rounded-full grid place-items-center text-white font-semibold text-sm shrink-0"
                            style={{ background: colorAvatar(name) }}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {name}
                            </span>
                            <StarRow rating={r.rating} />
                            <span className="text-xs text-muted-foreground">
                              · {timeAgo(r.createdAt)} ago
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">
                            {r.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: Sidebar */}
        <aside className="lg:w-72 shrink-0 space-y-4">
          {/* Maker card */}
          {app.creator && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Made by
              </div>
              <div className="flex items-center gap-3 mb-3">
                {app.creator.avatarUrl ? (
                  <img
                    src={app.creator.avatarUrl}
                    alt={creatorName}
                    className="size-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="size-12 rounded-xl grid place-items-center text-white font-bold text-lg shrink-0"
                    style={{ background: colorAvatar(creatorName) }}
                  >
                    {creatorName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{creatorName}</div>
                  {app.creator.verified && (
                    <div className="text-xs text-mint font-medium mt-0.5">
                      ✓ Verified maker
                    </div>
                  )}
                </div>
              </div>
              {app.creator.bio && (
                <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                  {app.creator.bio}
                </p>
              )}
              {app.creator.website && (
                <a
                  href={app.creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-mint hover:underline"
                >
                  <Globe className="size-3 shrink-0" />
                  <span className="truncate">
                    {app.creator.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* App details */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Details
            </div>

            {app.publishedAt && (
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Launched</div>
                  <div className="font-medium mt-0.5">
                    {formatDate(app.publishedAt)}
                  </div>
                </div>
              </div>
            )}

            {app.category && (
              <div className="flex items-start gap-2.5 text-sm">
                <Tag className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="font-medium mt-0.5">{app.category.name}</div>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t.tagId}
                      className="px-2 py-0.5 rounded-full bg-muted text-xs text-foreground/70"
                    >
                      #{t.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {app.launchUrl && (
              <div className="flex items-start gap-2.5 text-sm">
                <Globe className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Website</div>
                  <a
                    href={app.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-mint hover:underline truncate block mt-0.5"
                  >
                    {app.launchUrl.replace(/^https?:\/\//, "").split("/")[0]}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-card border border-border text-sm font-medium hover:-translate-y-0.5 transition"
          >
            <Share2 className="size-4" />
            Share this tool
          </button>
        </aside>
      </div>

      {/* ── Sticky mobile CTA ─────────────────────────────────────────────── */}
      {app.launchUrl && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none lg:hidden">
          <div className="mx-auto max-w-2xl flex items-center gap-2 pointer-events-auto">
            <a
              href={`${API_BASE_URL}/api/v1/apps/${app.id}/visit`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-1 inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              style={{
                background: "oklch(0.22 0.03 60)",
                boxShadow:
                  "0 1px 0 oklch(1 1 1 / 0.08) inset, 0 0 0 1px oklch(0.22 0.03 60), 0 10px 30px -8px oklch(0.22 0.03 60 / 0.5)",
              }}
            >
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "radial-gradient(120% 80% at 20% 0%, oklch(0.85 0.18 85 / 0.35), transparent 60%), radial-gradient(120% 80% at 100% 100%, oklch(0.7 0.18 168 / 0.35), transparent 60%)",
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
      )}
    </div>
  );
}
