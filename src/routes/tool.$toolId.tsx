import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUp,
  Share2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Star,
  Loader2,
  Globe,
  Tag,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Check,
  Heart,
  Eye,
  Send,
  ExternalLink,
  Bookmark,
  X,
  Play,
  Wand2,
  ImagePlus,
  Trash2,
  Info,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, apiUpload, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useApps } from "@/hooks/use-apps";
import { ToolCard } from "@/components/ToolCard";
import { useStore, actions, REACTION_EMOJIS, type ReactionEmoji, type User } from "@/lib/store";

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
  screenshots: string[];
  themePreference: string | null;
  logoUrl: string | null;
  logoColor: string | null;
  anonymous: boolean;
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

type TabId = "about" | "reviews" | "qa" | "discussion";

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

function timeAgoMs(ts: number): string {
  return timeAgo(new Date(ts).toISOString());
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

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/#]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/** Split a description into prose + bullet lines ("- ", "• ", "* ", "✓ "). */
function splitDescription(desc: string): { prose: string; bullets: string[] } {
  const lines = desc.split("\n");
  const bullets: string[] = [];
  const prose: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^[-•*✓✅☑]\s+/.test(t)) bullets.push(t.replace(/^[-•*✓✅☑]\s+/, ""));
    else prose.push(line);
  }
  return { prose: prose.join("\n").trim(), bullets };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AppLogo({
  app,
  logoUrl,
  logoColor,
}: {
  app: ApiApp;
  logoUrl: string;
  logoColor: string;
}) {
  if (logoUrl) {
    return (
      <div className="size-20 sm:size-24 rounded-2xl overflow-hidden shrink-0 bg-card grid place-items-center sticker">
        <img
          src={logoUrl}
          alt={app.name}
          className="size-full object-contain p-1.5"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = "none")
          }
        />
      </div>
    );
  }
  if (app.iconUrl) {
    return (
      <div
        className="size-20 sm:size-24 rounded-2xl grid place-items-center shrink-0 sticker"
        style={{ backgroundColor: logoColor }}
      >
        <img
          src={app.iconUrl}
          alt=""
          className="size-10 sm:size-12 rounded-xl"
          onError={(e) =>
            ((e.currentTarget as HTMLImageElement).style.display = "none")
          }
        />
      </div>
    );
  }
  return (
    <div
      className="size-20 sm:size-24 rounded-2xl grid place-items-center shrink-0 sticker"
      style={{ backgroundColor: logoColor }}
    >
      <span
        className="text-2xl sm:text-3xl font-bold text-white/90 select-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {app.name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
}

function ColorRow({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#14b8a6";
  return (
    <div className="mb-6">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 rounded-lg border border-border cursor-pointer bg-transparent shrink-0 overflow-hidden"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div
          className="size-10 rounded-lg border border-border shrink-0"
          style={{ background: /^#[0-9a-fA-F]{6}$/.test(value) ? value : "transparent" }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
    </div>
  );
}

function LogoPicker({
  appId,
  liveLogo,
  onLogoChange,
}: {
  appId: string;
  liveLogo: string;
  onLogoChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("logo", file);
      const result = await apiUpload<{ logoUrl: string }>(
        `/api/v1/apps/${appId}/logo`,
        form,
      );
      onLogoChange(result.logoUrl);
      toast.success("Logo uploaded!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mb-7">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
        Custom Logo
      </label>

      {/* Preview + actions */}
      <div className="flex items-center gap-4">
        {/* Preview box */}
        <div className="size-20 rounded-2xl border-2 border-dashed border-border bg-muted grid place-items-center shrink-0 overflow-hidden">
          {liveLogo ? (
            <img
              src={liveLogo}
              alt="Logo preview"
              className="size-full object-contain p-1"
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground/40" />
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted text-sm font-medium hover:bg-muted/70 disabled:opacity-50 transition"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <ImagePlus className="size-4 shrink-0" />
            )}
            {uploading ? "Uploading…" : "Choose from device"}
          </button>

          {liveLogo && (
            <button
              type="button"
              onClick={() => onLogoChange("")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-muted text-sm text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition"
            >
              <Trash2 className="size-3.5 shrink-0" />
              Remove logo
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input — accept="image/*" opens gallery on mobile, file browser on desktop */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />

      {uploadError && (
        <p className="text-xs text-destructive mt-2">{uploadError}</p>
      )}

      {/* Fallback: paste a URL */}
      <details className="mt-3 group">
        <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition list-none flex items-center gap-1">
          <ChevronRight className="size-3 group-open:rotate-90 transition-transform" />
          Or paste an image URL instead
        </summary>
        <input
          type="url"
          value={liveLogo}
          onChange={(e) => onLogoChange(e.target.value)}
          placeholder="https://yoursite.com/logo.png"
          className="mt-2 w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </details>
    </div>
  );
}

function OwnerEditPanel({
  appId,
  liveColor,
  liveLogoColor,
  liveLogo,
  onColorChange,
  onLogoColorChange,
  onLogoChange,
  onSave,
  saving,
}: {
  appId: string;
  liveColor: string;
  liveLogoColor: string;
  liveLogo: string;
  onColorChange: (c: string) => void;
  onLogoColorChange: (c: string) => void;
  onLogoChange: (l: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 mb-8 sticker">
      {/* Headline */}
      <div className="mb-7">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-soft border border-mint/20 text-mint text-xs font-medium mb-3">
          <Wand2 className="size-3" />
          Creator controls
        </div>
        <h2 className="font-semibold text-[1.4rem] tracking-tight text-foreground leading-snug">
          This is your baby.{" "}
          <span className="text-muted-foreground font-normal">
            Take 30 seconds to polish it.
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Changes are instant — visitors see exactly what you set.
        </p>
      </div>

      {/* Card Color */}
      <ColorRow
        label="Card Color"
        hint="Sets the card's banner gradient and glowing border."
        value={liveColor}
        placeholder="#14b8a6"
        onChange={onColorChange}
      />

      {/* Logo Color */}
      <ColorRow
        label="Logo Color"
        hint="Badge background when no icon is uploaded. Leave blank to match card color."
        value={liveLogoColor}
        placeholder="Same as card color"
        onChange={onLogoColorChange}
      />

      {/* Logo upload */}
      <LogoPicker appId={appId} liveLogo={liveLogo} onLogoChange={onLogoChange} />

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-foreground text-background disabled:opacity-50 hover:-translate-y-0.5 transition"
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Wand2 className="size-4" />
        )}
        {saving ? "Applying…" : "Apply changes"}
      </button>
    </div>
  );
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "size-5" : "size-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
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
          <span className="w-3 text-right font-medium text-foreground">{star}</span>
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

function VideoPlayer({ url }: { url: string }) {
  const embed = getVideoEmbed(url);
  const isDirect = !embed && /\.(mp4|webm|ogg)(\?|$)/i.test(url);

  if (embed) {
    return (
      <div className="rounded-3xl overflow-hidden sticker bg-black">
        <div className="aspect-video">
          <iframe
            src={embed}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        </div>
      </div>
    );
  }

  if (isDirect) {
    return (
      <div className="rounded-3xl overflow-hidden sticker bg-black">
        <div className="aspect-video">
          <video src={url} controls className="w-full h-full object-contain" />
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-4 rounded-3xl bg-card sticker hover:-translate-y-0.5 transition group"
    >
      <div className="size-12 rounded-xl bg-muted grid place-items-center shrink-0">
        <Play className="size-5 text-mint" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">Watch Demo</div>
        <div className="text-xs text-muted-foreground truncate">{url}</div>
      </div>
      <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
    </a>
  );
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="size-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? "w-5 h-2 bg-white"
                  : "size-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Outlined content card matching the mockup style. */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-card sticker p-5 sm:p-7 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl tracking-tight mb-4 flex items-center gap-2">
      {icon && <span className="text-mint">{icon}</span>}
      {children}
    </h2>
  );
}

function StatBox({
  icon,
  label,
  value,
  suffix,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-left sticker transition ${
        active ? "bg-primary" : "bg-card"
      } ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <div className="font-display text-3xl leading-none">
        {value}
        {suffix && (
          <span className="text-base text-muted-foreground ml-0.5">{suffix}</span>
        )}
      </div>
    </Tag>
  );
}

function LocalAvatar({ user, fallback }: { user?: User; fallback: string }) {
  return (
    <div
      className="size-10 rounded-full grid place-items-center text-base shrink-0 sticker"
      style={{ background: user?.avatarColor ?? colorAvatar(fallback) }}
    >
      {user?.emoji ?? (
        <span className="text-white font-semibold text-sm">
          {fallback.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "about", label: "About", icon: <Info className="size-4" /> },
  { id: "reviews", label: "Reviews", icon: <Star className="size-4" /> },
  { id: "qa", label: "Q&A", icon: <HelpCircle className="size-4" /> },
  { id: "discussion", label: "Discussion", icon: <MessageCircle className="size-4" /> },
];

function ToolDetail() {
  const { toolId } = Route.useParams();
  const { isAuthenticated, user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const {
    upvoted, liked, bookmarked, reactions, myReactions,
    questions, comments, users, currentUserId,
  } = useStore();
  const { tools: allTools } = useApps();

  const [activeTab, setActiveTab] = useState<TabId>("about");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerBody, setAnswerBody] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Owner customization state
  const [liveColor, setLiveColor] = useState("");
  const [liveLogoColor, setLiveLogoColor] = useState("");
  const [liveLogo, setLiveLogo] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const styleInit = useRef(false);

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
    onError: (err: Error) =>
      toast.error(err.message || "Failed to submit review"),
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

  // Initialize customization state once from loaded app data
  useEffect(() => {
    if (app && !styleInit.current) {
      styleInit.current = true;
      setLiveColor(app.primaryColor ?? "#14b8a6");
      setLiveLogoColor(app.logoColor ?? "");
      setLiveLogo(app.logoUrl ?? "");
    }
  }, [app]);

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
        <Link to="/" className="mt-4 inline-block text-mint hover:underline">
          ← Back to discover
        </Link>
      </div>
    );
  }

  const coverColor = liveColor || app.primaryColor || "#14b8a6";
  const logoColor = liveLogoColor || coverColor;
  const creatorName =
    app.creator?.displayName || app.creator?.user?.email || "Unknown maker";
  const reviews = reviewsData?.items ?? [];
  const avgRating = reviewsData?.avgRating ?? 0;
  const reviewCount = reviewsData?.total ?? 0;
  const launchCount = app._count?.launchEvents ?? 0;
  const tags = app.tags ?? [];
  const isUpvoted = upvoted.has(toolId);
  const isLiked = liked.has(toolId);
  const isBookmarked = bookmarked.has(toolId);
  const appReactions = reactions[toolId] ?? {};
  const myAppReactions = new Set<ReactionEmoji>(
    (myReactions[toolId] ?? []) as ReactionEmoji[]
  );
  const isOwner =
    isAuthenticated &&
    !!app.creator?.user?.email &&
    authUser?.email === app.creator.user.email;

  const assetScreenshotUrls = (app.assets ?? [])
    .filter((a) => a.type === "SCREENSHOT")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => a.url);
  const allScreenshots = [
    ...new Set([...(app.screenshots ?? []), ...assetScreenshotUrls]),
  ];

  const { prose: aboutProse, bullets: loveBullets } = splitDescription(
    app.description ?? ""
  );

  const toolQuestions = questions
    .filter((q) => q.toolId === toolId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const toolComments = comments
    .filter((c) => c.toolId === toolId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const findUser = (id: string) => users.find((u) => u.id === id);

  const related = allTools
    .filter(
      (t) =>
        t.id !== toolId &&
        (!app.category || t.category === app.category.name)
    )
    .slice(0, 3);

  let domain = "";
  try {
    domain = new URL(app.launchUrl ?? "").hostname.replace(/^www\./, "");
  } catch {}
  const launchedAgo = timeAgo(app.publishedAt ?? app.createdAt);

  async function saveAppStyle() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/apps/${app!.id}`, {
        method: "PATCH",
        body: {
          primaryColor: /^#[0-9a-fA-F]{6}$/.test(liveColor) ? liveColor : undefined,
          logoColor:    /^#[0-9a-fA-F]{6}$/.test(liveLogoColor) ? liveLogoColor : null,
          logoUrl:      liveLogo || null,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["app", toolId] });
      toast.success("Card updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  }

  function trackVisit() {
    fetch(`${API_BASE_URL}/api/v1/apps/${app!.id}/view`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 pb-40">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="size-3.5" />
          <Link to="/trending" className="hover:text-foreground transition-colors">Tools</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{app.name}</span>
        </nav>

        {/* ── Owner controls (collapsed by default — public view stays clean) ── */}
        {isOwner && (
          <div className="mb-6">
            <button
              onClick={() => setShowOwnerPanel((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-mint-soft border border-mint/20 text-mint hover:bg-mint/10 transition"
            >
              <Wand2 className="size-3.5" />
              {showOwnerPanel ? "Hide editor" : "Edit listing"}
            </button>
            {showOwnerPanel && (
              <div className="mt-4">
                <OwnerEditPanel
                  appId={app.id}
                  liveColor={liveColor}
                  liveLogoColor={liveLogoColor}
                  liveLogo={liveLogo}
                  onColorChange={setLiveColor}
                  onLogoColorChange={setLiveLogoColor}
                  onLogoChange={setLiveLogo}
                  onSave={saveAppStyle}
                  saving={saving}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Hero card ────────────────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <AppLogo app={app} logoUrl={liveLogo} logoColor={logoColor} />
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-5xl tracking-tight leading-none mb-1.5">
                {app.name}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {app.tagline}
              </p>

              {/* Badge row */}
              <div className="mt-3 flex items-center gap-x-3 gap-y-1.5 flex-wrap text-xs">
                {app.category && (
                  <span className="px-2.5 py-1 rounded-full bg-primary font-semibold sticker">
                    {app.category.name}
                  </span>
                )}
                {tags.map((t) => (
                  <span key={t.tagId} className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    #{t.tag.name}
                  </span>
                ))}
                {domain && app.launchUrl && (
                  <a
                    href={app.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={trackVisit}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-mint transition-colors"
                  >
                    <Globe className="size-3.5" />
                    {domain}
                  </a>
                )}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {launchedAgo} ago
                </span>
                {launchCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Eye className="size-3.5" />
                    {launchCount.toLocaleString()} visits
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stat boxes */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox
              icon={<ArrowUp className="size-3.5" />}
              label="Upvotes"
              value={isUpvoted ? 1 : 0}
              active={isUpvoted}
              onClick={() => actions.toggleUpvote(toolId)}
            />
            <StatBox
              icon={<Star className="size-3.5" />}
              label="Rating"
              value={reviewCount > 0 ? avgRating.toFixed(1) : "—"}
              suffix="/5"
            />
            <StatBox
              icon={<MessageSquare className="size-3.5" />}
              label="Reviews"
              value={reviewCount}
            />
            <StatBox
              icon={<HelpCircle className="size-3.5" />}
              label="Q&A"
              value={toolQuestions.length}
            />
          </div>

          {/* React row */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium mr-1">React:</span>
            {REACTION_EMOJIS.map((emoji) => {
              const count = appReactions[emoji] ?? 0;
              const active = myAppReactions.has(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => actions.toggleReaction(toolId, emoji)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition sticker hover:-translate-y-0.5 ${
                    active ? "bg-primary" : "bg-card"
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
                </button>
              );
            })}
            <span className="flex-1" />
            <button
              onClick={() => actions.toggleLike(toolId)}
              className={`grid place-items-center size-9 rounded-full transition sticker hover:-translate-y-0.5 ${
                isLiked ? "bg-primary" : "bg-card"
              }`}
              aria-label="Like"
            >
              <Heart className={`size-4 ${isLiked ? "fill-foreground" : ""}`} />
            </button>
            <button
              onClick={() => actions.toggleBookmark(toolId)}
              className={`grid place-items-center size-9 rounded-full transition sticker hover:-translate-y-0.5 ${
                isBookmarked ? "bg-mint-soft" : "bg-card"
              }`}
              aria-label="Save"
            >
              <Bookmark className={`size-4 ${isBookmarked ? "fill-mint text-mint" : ""}`} />
            </button>
          </div>
        </Card>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition sticker ${
                activeTab === t.id
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground/70 hover:text-foreground hover:-translate-y-0.5"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* Media gallery */}
            {app.videoUrl && <VideoPlayer url={app.videoUrl} />}
            {allScreenshots.length > 0 && (
              <div
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-4 sm:-mx-6 px-4 sm:px-6"
                style={{ scrollbarWidth: "none" }}
              >
                {allScreenshots.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="shrink-0 snap-start rounded-3xl overflow-hidden cursor-zoom-in group relative sticker"
                    style={{ width: "min(82vw, 560px)", aspectRatio: "16/9" }}
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            )}
            {lightboxIndex !== null && (
              <Lightbox
                images={allScreenshots}
                startIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}

            {/* About */}
            {(aboutProse || !loveBullets.length) && (
              <Card>
                <CardTitle>About {app.name}</CardTitle>
                <p className="text-foreground/75 leading-relaxed whitespace-pre-line">
                  {aboutProse || app.description}
                </p>
              </Card>
            )}

            {/* What you'll love */}
            {loveBullets.length > 0 && (
              <Card>
                <CardTitle icon={<Sparkles className="size-5" />}>
                  What you'll love
                </CardTitle>
                <ul className="space-y-3">
                  {loveBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 size-5 rounded-full bg-primary grid place-items-center shrink-0 sticker">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/80 leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Tagged with */}
            {tags.length > 0 && (
              <Card>
                <CardTitle icon={<Tag className="size-5" />}>Tagged with</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t.tagId}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground/70"
                    >
                      #{t.tag.name}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Meet the maker */}
            {app.creator && !app.anonymous && (
              <Card>
                <CardTitle>Meet the maker</CardTitle>
                <div className="flex items-start gap-4">
                  {app.creator.avatarUrl ? (
                    <img
                      src={app.creator.avatarUrl}
                      alt={creatorName}
                      className="size-14 rounded-2xl object-cover shrink-0 sticker"
                    />
                  ) : (
                    <div
                      className="size-14 rounded-2xl grid place-items-center text-white font-bold shrink-0 sticker"
                      style={{ background: colorAvatar(creatorName) }}
                    >
                      {creatorName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-xl tracking-tight">
                      {creatorName}
                      {app.creator.verified && (
                        <span className="ml-2 text-xs text-mint font-sans font-medium align-middle">
                          ✓ Verified maker
                        </span>
                      )}
                    </div>
                    {app.creator.user?.email && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        @{userHandle(app.creator.user.email)}
                      </div>
                    )}
                    {app.creator.bio && (
                      <p className="text-sm text-foreground/70 leading-relaxed mt-2">
                        {app.creator.bio}
                      </p>
                    )}
                    {app.creator.website && (
                      <a
                        href={app.creator.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-mint hover:underline"
                      >
                        <Globe className="size-3 shrink-0" />
                        <span className="truncate">
                          {app.creator.website.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Launched date */}
            {app.publishedAt && (
              <p className="text-xs text-muted-foreground text-center">
                Launched {formatDate(app.publishedAt)}
              </p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Rating summary */}
            {reviewCount > 0 && !reviewsLoading && (
              <Card className="flex flex-col sm:flex-row gap-6">
                <div className="text-center shrink-0 sm:pr-6 sm:border-r sm:border-border">
                  <div className="font-display text-7xl leading-none">{avgRating.toFixed(1)}</div>
                  <div className="mt-2"><StarRow rating={Math.round(avgRating)} size="lg" /></div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                  <RatingHistogram items={reviews} />
                </div>
              </Card>
            )}

            {/* Write a review */}
            <Card>
              <CardTitle icon={<Star className="size-5" />}>Write a review</CardTitle>
              {isAuthenticated ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reviewRating === 0) { toast.error("Please pick a rating"); return; }
                    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }
                    submitReview.mutate({ rating: reviewRating, comment: reviewComment.trim() });
                  }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <StarPicker value={reviewRating} onChange={setReviewRating} />
                    {reviewRating > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {["", "Poor", "Fair", "Good", "Great", "Excellent"][reviewRating]}
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
                    <span className="text-xs text-muted-foreground">{reviewComment.length}/1000</span>
                    <button
                      type="submit"
                      disabled={submitReview.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-foreground text-background disabled:opacity-50 hover:-translate-y-0.5 transition"
                    >
                      {submitReview.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                      Submit review
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="text-mint hover:underline font-medium">Sign in</Link> to leave a review.
                </p>
              )}
            </Card>

            {/* Review list */}
            {reviewsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No reviews yet — be the first to share your experience!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const name = r.user ? userHandle(r.user.email) : "User";
                  return (
                    <Card key={r.id} className="!p-5">
                      <div className="flex items-start gap-3">
                        {r.user?.avatarUrl ? (
                          <img src={r.user.avatarUrl} alt={name} className="size-10 rounded-full object-cover shrink-0" />
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
                            <span className="font-semibold text-sm">{name}</span>
                            <StarRow rating={r.rating} />
                            <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)} ago</span>
                          </div>
                          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "qa" && (
          <div className="space-y-6">
            {/* Ask a question */}
            <Card>
              <CardTitle icon={<HelpCircle className="size-5" />}>
                Ask the maker
              </CardTitle>
              {isAuthenticated ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!questionBody.trim()) { toast.error("Please write a question"); return; }
                    actions.askQuestion(toolId, questionBody.trim());
                    setQuestionBody("");
                    toast.success("Question posted!");
                  }}
                  className="flex items-start gap-2"
                >
                  <textarea
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder={`Anything you'd like to know about ${app.name}?`}
                    value={questionBody}
                    onChange={(e) => setQuestionBody(e.target.value)}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    className="grid place-items-center size-10 rounded-full bg-foreground text-background shrink-0 hover:-translate-y-0.5 transition"
                    aria-label="Ask"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="text-mint hover:underline font-medium">Sign in</Link> to ask a question.
                </p>
              )}
            </Card>

            {/* Question list */}
            {toolQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No questions yet — ask the first one!
              </div>
            ) : (
              <div className="space-y-3">
                {toolQuestions.map((q) => {
                  const asker = findUser(q.userId);
                  return (
                    <Card key={q.id} className="!p-5">
                      <div className="flex items-start gap-3">
                        <LocalAvatar user={asker} fallback={asker?.name ?? "User"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{asker?.name ?? "User"}</span>
                            <span className="text-xs text-muted-foreground">· {timeAgoMs(q.createdAt)} ago</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground/85 leading-relaxed">{q.body}</p>

                          {q.answer ? (
                            <div className="mt-3 rounded-2xl bg-mint-soft border border-mint/25 px-4 py-3">
                              <div className="text-[11px] font-semibold text-mint uppercase tracking-wider mb-1">
                                Answer from the maker
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed">{q.answer}</p>
                            </div>
                          ) : isOwner && (
                            answeringId === q.id ? (
                              <form
                                className="mt-3 flex items-start gap-2"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!answerBody.trim()) return;
                                  actions.answerQuestion(q.id, answerBody.trim());
                                  setAnsweringId(null);
                                  setAnswerBody("");
                                  toast.success("Answer posted!");
                                }}
                              >
                                <textarea
                                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                  rows={2}
                                  autoFocus
                                  placeholder="Write your answer…"
                                  value={answerBody}
                                  onChange={(e) => setAnswerBody(e.target.value)}
                                  maxLength={1000}
                                />
                                <button
                                  type="submit"
                                  className="grid place-items-center size-9 rounded-full bg-foreground text-background shrink-0"
                                  aria-label="Answer"
                                >
                                  <Send className="size-3.5" />
                                </button>
                              </form>
                            ) : (
                              <button
                                onClick={() => { setAnsweringId(q.id); setAnswerBody(""); }}
                                className="mt-2 text-xs font-semibold text-mint hover:underline"
                              >
                                Answer this question
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "discussion" && (
          <div className="space-y-6">
            {/* Post a comment */}
            <Card>
              <CardTitle icon={<MessageCircle className="size-5" />}>
                Join the discussion
              </CardTitle>
              {isAuthenticated ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!commentBody.trim()) { toast.error("Please write a comment"); return; }
                    actions.addComment(toolId, commentBody.trim());
                    setCommentBody("");
                    toast.success("Comment posted!");
                  }}
                  className="flex items-start gap-2"
                >
                  <textarea
                    className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="Share your thoughts…"
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    className="grid place-items-center size-10 rounded-full bg-foreground text-background shrink-0 hover:-translate-y-0.5 transition"
                    aria-label="Post"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="text-mint hover:underline font-medium">Sign in</Link> to join the discussion.
                </p>
              )}
            </Card>

            {/* Comment list */}
            {toolComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No comments yet — start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {toolComments.map((c) => {
                  const author = findUser(c.userId);
                  return (
                    <Card key={c.id} className="!p-5">
                      <div className="flex items-start gap-3">
                        <LocalAvatar user={author} fallback={author?.name ?? "User"} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{author?.name ?? "User"}</span>
                            {author?.username && (
                              <span className="text-xs text-muted-foreground">@{author.username}</span>
                            )}
                            <span className="text-xs text-muted-foreground">· {timeAgoMs(c.createdAt)} ago</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground/85 leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── More in category ─────────────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl tracking-tight mb-4">
              More in {app.category?.name ?? "the yard"}
            </h2>
            <div className="space-y-3">
              {related.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────────── */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
        <div className="mx-auto max-w-xl flex items-center gap-2 pointer-events-auto">
          {app.launchUrl && (
            <a
              href={app.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackVisit}
              className="group flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3 sm:py-3.5 rounded-full bg-foreground text-background sticker transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]"
            >
              <span className="font-display text-lg sm:text-xl leading-none tracking-tight whitespace-nowrap">
                Visit {app.name}
              </span>
              <span
                aria-hidden
                className="grid place-items-center size-7 rounded-full bg-primary text-foreground transition-transform duration-300 group-hover:rotate-45"
              >
                <ExternalLink className="size-3.5" strokeWidth={2.5} />
              </span>
            </a>
          )}
          <button
            onClick={copyLink}
            className="shrink-0 grid place-items-center size-12 rounded-full bg-card sticker hover:-translate-y-0.5 transition"
            aria-label="Share"
          >
            <Share2 className="size-4" />
          </button>
          <button
            onClick={() => actions.toggleUpvote(toolId)}
            className={`shrink-0 flex flex-col items-center justify-center min-w-[52px] px-3 py-1.5 rounded-2xl transition sticker hover:-translate-y-0.5 ${
              isUpvoted ? "bg-primary" : "bg-card"
            }`}
            aria-label="Upvote"
          >
            <ArrowUp className="size-4" strokeWidth={2.75} />
            <span className="font-display text-base leading-none mt-0.5">
              {isUpvoted ? 1 : 0}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
