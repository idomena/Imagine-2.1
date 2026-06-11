import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Link2, Sparkles, Loader2, Pencil, Wand2, LogIn,
  Shield, X, Check, ChevronRight, UploadCloud,
  Play, Film, ExternalLink, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, apiUpload } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, type ApiCategory } from "@/hooks/use-apps";
import { CATEGORIES } from "@/lib/store";

export const Route = createFileRoute("/submit")({
  component: SubmitPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "auto" | "manual";

type ScrapeResult = {
  name: string;
  tagline: string;
  description: string;
  iconUrl: string;
  ogImage: string | null;
  partial?: boolean; // true = site blocked scraping; data is URL-derived
};

type LaunchPhase = "creating" | "screenshots" | "video" | "publishing";

// ─── Utilities ────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

function getCardBg(cardTheme: string, primaryColor: string): React.CSSProperties {
  if (cardTheme === "dark")
    return {
      background: "#000000",
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
      backgroundSize: "18px 18px",
    };
  if (cardTheme === "light") return { background: "#fafafa" };
  if (cardTheme === "mesh")
    return {
      background: `radial-gradient(ellipse at 20% 25%, ${primaryColor}55 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, #6366f155 0%, transparent 55%), radial-gradient(ellipse at 50% 100%, #f59e0b33 0%, transparent 45%), #06060a`,
    };
  if (cardTheme?.startsWith("#")) return { background: cardTheme };
  return { background: `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}08)` };
}

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-3 rounded-2xl bg-background border border-border/80 focus:border-foreground/25 focus:ring-1 focus:ring-foreground/10 outline-none text-sm placeholder:text-muted-foreground/50 transition-colors";

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold tracking-tight">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`size-8 rounded-full grid place-items-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-primary text-background"
                    : active
                    ? "bg-foreground text-background ring-4 ring-foreground/10"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : idx}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap tracking-wide uppercase ${
                  active ? "text-foreground" : "text-muted-foreground/60"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 sm:w-20 h-px mx-2 mb-5 transition-colors duration-500 ${
                  done ? "bg-primary" : "bg-border/60"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── App Preview Card ─────────────────────────────────────────────────────────

function AppPreviewCard({
  name,
  tagline,
  iconUrl,
  primaryColor,
  cardTheme,
}: {
  name: string;
  tagline: string;
  iconUrl: string;
  primaryColor: string;
  cardTheme: string;
}) {
  const isLight = cardTheme === "light";
  const textColor = isLight ? "text-zinc-900" : "text-white";
  const mutedColor = isLight ? "text-zinc-500" : "text-white/50";

  return (
    <div
      className="relative rounded-2xl overflow-hidden border w-full max-w-xs mx-auto"
      style={{
        ...getCardBg(cardTheme, primaryColor),
        borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
        boxShadow: `0 0 0 1px ${primaryColor}22, 0 20px 50px -10px ${primaryColor}44`,
      }}
    >
      <div className="p-5">
        <div className="mb-4">
          <div
            className="size-14 rounded-2xl grid place-items-center shrink-0 overflow-hidden"
            style={{ background: primaryColor, boxShadow: `0 4px 16px -2px ${primaryColor}88` }}
          >
            {iconUrl ? (
              <img
                src={iconUrl}
                alt=""
                className="size-full object-contain p-1"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <span className="text-2xl font-bold text-white select-none">
                {(name || "AP").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <h3 className={`font-semibold text-[1rem] leading-tight mb-1 ${textColor}`}>
          {name || "Your App Name"}
        </h3>
        <p className={`text-xs leading-relaxed line-clamp-2 ${mutedColor}`}>
          {tagline || "Your tagline will appear here — make it punchy."}
        </p>
        <div
          className="mt-4 pt-3 flex items-center justify-between"
          style={{ borderTop: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
            style={{ background: `${primaryColor}22`, color: primaryColor }}
          >
            New
          </span>
          <span className={`text-[10px] font-mono ${mutedColor}`}>imaginehq.services</span>
        </div>
      </div>
    </div>
  );
}

// ─── Screenshot thumbnail ─────────────────────────────────────────────────────

function ScreenshotThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objUrl = URL.createObjectURL(file);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [file]);

  return (
    <div className="group relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-lg">
      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-all duration-200 size-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 grid place-items-center text-white hover:bg-white/20"
          aria-label="Remove screenshot"
        >
          <X className="size-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 size-6 rounded-full bg-black/70 backdrop-blur-sm text-white/90 grid place-items-center sm:hidden"
        aria-label="Remove screenshot"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

// ─── Screenshot dropzone ──────────────────────────────────────────────────────

const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_MB = 10;

function ScreenshotDropzone({ files, onFilesChange }: { files: File[]; onFilesChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const remaining = MAX_SCREENSHOTS - files.length;

  function addFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (arr.length < Array.from(incoming).length)
      toast.error("Only image files are accepted for screenshots");
    const oversized = arr.filter((f) => f.size > MAX_SCREENSHOT_MB * 1024 * 1024);
    if (oversized.length > 0)
      toast.error(`Each screenshot must be under ${MAX_SCREENSHOT_MB} MB`);
    const valid = arr.filter((f) => f.size <= MAX_SCREENSHOT_MB * 1024 * 1024).slice(0, remaining);
    if (valid.length > 0) onFilesChange([...files, ...valid]);
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
      />

      {remaining > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
          className={`relative cursor-pointer rounded-2xl border transition-all duration-300 p-10 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-md ${
            isDragging
              ? "border-primary/60 bg-primary/5 shadow-[0_0_0_1px_rgba(20,184,166,0.2)] scale-[0.99]"
              : "border-border/60 bg-muted/20 hover:border-foreground/20 hover:bg-muted/30"
          }`}
        >
          <div
            className={`absolute inset-4 rounded-xl border border-dashed pointer-events-none transition-colors ${
              isDragging ? "border-primary/30" : "border-border/30"
            }`}
          />
          <div className="flex flex-col items-center gap-4 relative">
            <div className={`size-14 rounded-2xl grid place-items-center transition-colors ${isDragging ? "bg-primary/15" : "bg-muted/60"}`}>
              <UploadCloud className={`size-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/60"}`} />
            </div>
            <div>
              <p className="font-semibold text-sm tracking-tight">
                {isDragging ? "Drop to upload" : "Drag & drop files or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                PNG, JPG, WEBP · {remaining} slot{remaining !== 1 ? "s" : ""} remaining · {MAX_SCREENSHOT_MB} MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {files.map((file, i) => (
            <ScreenshotThumb
              key={`${file.name}-${file.lastModified}`}
              file={file}
              onRemove={() => onFilesChange(files.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Video dropzone ───────────────────────────────────────────────────────────

const MAX_VIDEO_MB = 100;

function VideoDropzone({ file, onFileChange }: { file: File | null; onFileChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFile(f: File) {
    if (!f.type.startsWith("video/")) { toast.error("Only video files are accepted"); return; }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) { toast.error(`Video must be under ${MAX_VIDEO_MB} MB`); return; }
    onFileChange(f);
  }

  if (file) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 backdrop-blur-md p-4 flex items-center gap-4">
        <div className="size-20 rounded-xl overflow-hidden bg-black shrink-0 relative">
          {previewUrl && <video src={previewUrl} className="size-full object-cover" muted playsInline />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 grid place-items-center">
              <Play className="size-3.5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate tracking-tight">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type.replace("video/", "") || "video"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="shrink-0 size-9 rounded-full hover:bg-muted grid place-items-center transition text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
          aria-label="Remove video"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className={`relative cursor-pointer rounded-2xl border transition-all duration-300 p-8 text-center select-none outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-md ${
          isDragging
            ? "border-primary/60 bg-primary/5 shadow-[0_0_0_1px_rgba(20,184,166,0.2)] scale-[0.99]"
            : "border-border/60 bg-muted/20 hover:border-foreground/20 hover:bg-muted/30"
        }`}
      >
        <div className={`absolute inset-4 rounded-xl border border-dashed pointer-events-none transition-colors ${isDragging ? "border-primary/30" : "border-border/30"}`} />
        <div className="flex flex-col items-center gap-4 relative">
          <div className={`size-14 rounded-2xl grid place-items-center transition-colors ${isDragging ? "bg-primary/15" : "bg-muted/60"}`}>
            <Film className={`size-6 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground/60"}`} />
          </div>
          <div>
            <p className="font-semibold text-sm tracking-tight">
              {isDragging ? "Drop to upload" : "Drag & drop or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">MP4, MOV, WEBM · Max {MAX_VIDEO_MB} MB</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Card presets ─────────────────────────────────────────────────────────────

const CARD_PRESETS = [
  { id: "dark",  label: "Elite Dark",     desc: "Pure black + grid", swatch: "bg-black border-white/10" },
  { id: "light", label: "High-End Light", desc: "Clean minimal",     swatch: "bg-zinc-100 border-zinc-300" },
  { id: "mesh",  label: "Mesh Gradient",  desc: "Dynamic spheres",   swatch: "bg-gradient-to-br from-teal-900/80 via-indigo-900/80 to-amber-900/60 border-white/10" },
];

// ─── Launch progress ──────────────────────────────────────────────────────────

function LaunchProgress({
  phase,
  done,
  hasScreenshots,
  hasVideo,
}: {
  phase: LaunchPhase;
  done: LaunchPhase[];
  hasScreenshots: boolean;
  hasVideo: boolean;
}) {
  const steps: { key: LaunchPhase; label: string }[] = [
    { key: "creating", label: "Create listing" },
    ...(hasScreenshots ? [{ key: "screenshots" as LaunchPhase, label: "Upload screenshots" }] : []),
    ...(hasVideo ? [{ key: "video" as LaunchPhase, label: "Upload video" }] : []),
    { key: "publishing", label: "Security scan & publish" },
  ];

  return (
    <div className="bg-card border border-border rounded-3xl p-10 sticker">
      <div className="flex flex-col items-center gap-8">
        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Rocket className="size-7 text-primary animate-bounce" />
        </div>

        <div className="text-center">
          <h2 className="font-bold text-xl tracking-tight">Launching your tool…</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {phase === "publishing" ? "Running security scan, almost there…" : "Just a moment."}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          {steps.map(({ key, label }) => {
            const isDone = done.includes(key);
            const isActive = phase === key;
            return (
              <div
                key={key}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isDone || isActive ? "opacity-100" : "opacity-25"
                }`}
              >
                <div
                  className={`size-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                    isDone
                      ? "bg-primary border-primary"
                      : isActive
                      ? "border-foreground/50 bg-transparent"
                      : "border-border bg-transparent"
                  }`}
                >
                  {isDone ? (
                    <Check className="size-3 text-background" strokeWidth={3} />
                  ) : isActive ? (
                    <Loader2 className="size-3 animate-spin text-foreground" />
                  ) : null}
                </div>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isDone
                      ? "line-through text-muted-foreground"
                      : isActive
                      ? "font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {isActive && key === "publishing" && (
                  <span className="ml-auto text-xs text-muted-foreground/60 animate-pulse">~10s</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function SubmitPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/submit" });
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: categories } = useCategories();

  const [mode, setMode] = useState<Mode>("auto");
  const [url, setUrl] = useState((search as Record<string, unknown>).url as string || "");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const [cardTheme, setCardTheme] = useState("dark");
  const [primaryColor, setPrimaryColor] = useState("#14b8a6");
  const [logoUrl, setLogoUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const [fetching, setFetching] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // ── Launch state ──────────────────────────────────────────────────────────
  const [launchPhase, setLaunchPhase] = useState<LaunchPhase | null>(null);
  const [launchDone, setLaunchDone] = useState<LaunchPhase[]>([]);
  const [launched, setLaunched] = useState<{ id: string; slug: string } | null>(null);
  const [countdown, setCountdown] = useState(5);

  const categoryOptions: ApiCategory[] = categories?.length
    ? categories
    : CATEGORIES.filter((c) => c !== "All").map((n) => ({ id: n, name: n, slug: slugify(n) }));

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryId) setCategoryId(categoryOptions[0].id);
  }, [categoryOptions, categoryId]);

  useEffect(() => {
    const incomingUrl = (search as Record<string, unknown>).url as string;
    if (incomingUrl) handleFetch(incomingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown redirect after launch ──────────────────────────────────────
  useEffect(() => {
    if (!launched) return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate({ to: "/tool/$toolId", params: { toolId: launched.slug } });
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [launched, navigate]);

  // ── Scrape ────────────────────────────────────────────────────────────────

  const handleFetch = async (overrideUrl?: string) => {
    const raw = overrideUrl ?? url;
    if (!raw.trim()) return toast.error("Paste your tool URL first");

    let normalized = raw.trim();
    // Silently upgrade http → https
    if (normalized.startsWith("http://")) normalized = "https://" + normalized.slice(7);
    if (!normalized.startsWith("http")) normalized = `https://${normalized}`;
    try { new URL(normalized); } catch { return toast.error("That doesn't look like a valid URL"); }

    setUrl(normalized);
    setFetching(true);

    try {
      const data = await apiFetch<ScrapeResult>("/api/v1/apps/scrape", {
        method: "POST",
        body: { url: normalized },
      });
      setName(data.name || "");
      setTagline(data.tagline || "");
      setDescription(data.description || "");
      setIconUrl(data.iconUrl || "");
      if (data.ogImage && !logoUrl) setLogoUrl(data.ogImage);
      if (data.partial) {
        toast.info("This site blocks automated scrapers — we pre-filled what we could. Review and edit below.");
      }
      setStep(2);
    } catch (err) {
      // Network error / server down — derive name from hostname as last resort
      try {
        const host = new URL(normalized).hostname.replace(/^www\./, "");
        const stem = host.split(".")[0] ?? "";
        setName(stem.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
        setTagline("A delightful new tool");
      } catch { /* ignore */ }
      toast.error("Couldn't reach the server — fill in the details below.");
      setStep(2);
    } finally {
      setFetching(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return toast.error("Name and tagline are required");
    if (!url.trim()) return toast.error("A URL is required");
    if (!agreedToTerms) return toast.error("You must agree to the terms to continue");

    let finalUrl = url.trim();
    if (finalUrl.startsWith("http://")) finalUrl = "https://" + finalUrl.slice(7);
    if (!finalUrl.startsWith("http")) finalUrl = `https://${finalUrl}`;
    try { new URL(finalUrl); } catch { return toast.error("Invalid URL"); }

    const slug = slugify(name.trim());
    if (!slug) return toast.error("Could not generate a slug from that name");

    setLaunchDone([]);
    setLaunchPhase("creating");

    try {
      // 1 ── Create DRAFT
      const created = await apiFetch<{ id: string; slug: string }>("/api/v1/apps", {
        method: "POST",
        body: {
          slug,
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim() || undefined,
          launchUrl: finalUrl,
          categoryId: categoryId || undefined,
          primaryColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : undefined,
          agreedToTerms,
          anonymous,
        },
      });
      setLaunchDone((p) => [...p, "creating"]);

      // Styling patch (fire-and-forget, non-blocking)
      if (cardTheme || logoUrl) {
        apiFetch(`/api/v1/apps/${created.id}`, {
          method: "PATCH",
          body: { themePreference: cardTheme || null, logoUrl: logoUrl || null },
        }).catch(() => {});
      }

      // 2 ── Screenshots
      if (screenshotFiles.length > 0) {
        setLaunchPhase("screenshots");
        const fd = new FormData();
        screenshotFiles.forEach((f) => fd.append("screenshots", f));
        await apiUpload(`/api/v1/apps/${created.id}/screenshots`, fd).catch(
          (err: Error) => toast.error(`Screenshots: ${err.message}`)
        );
        setLaunchDone((p) => [...p, "screenshots"]);
      }

      // 3 ── Video
      if (videoFile) {
        setLaunchPhase("video");
        const fd = new FormData();
        fd.append("video", videoFile);
        await apiUpload(`/api/v1/apps/${created.id}/video`, fd, 180_000).catch(
          (err: Error) => toast.error(`Video: ${err.message}`)
        );
        setLaunchDone((p) => [...p, "video"]);
      }

      // 4 ── Submit → backend transitions DRAFT→SUBMITTED and kicks off async scan
      setLaunchPhase("publishing");
      await apiFetch(`/api/v1/apps/${created.id}/submit`, { method: "POST", body: {} });

      // 5 ── Poll until PUBLISHED (scan runs async, typically 3-12s)
      for (let i = 0; i < 45; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const app = await apiFetch<{ status: string }>(`/api/v1/apps/${created.id}`);
        if (app.status === "PUBLISHED") break;
        if (app.status === "REJECTED") {
          throw new Error("Your app was flagged by our security scanner. Please review the content and try again.");
        }
      }

      // Done!
      setLaunchDone((p) => [...p, "publishing"]);
      setLaunchPhase(null);
      setLaunched({ id: created.id, slug: created.slug });

    } catch (err) {
      setLaunchPhase(null);
      setLaunchDone([]);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("already taken")) {
        toast.error("That name is already taken — try adding a word or number.");
      } else {
        toast.error(msg);
      }
    }
  };

  // ── Auth guards ──────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Sign in first</h1>
        <p className="mt-3 text-muted-foreground">You need an account to submit a tool.</p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-6 py-3 font-semibold sticker hover:-translate-y-0.5 transition"
        >
          <LogIn className="size-4" /> Log in / Register
        </Link>
      </div>
    );
  }

  const startManual = () => { setMode("manual"); setStep(2); };
  const STEP_LABELS = ["Add URL", "Details", "Polish It"];
  const isLaunching = launchPhase !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium sticker mb-5">
          <Sparkles className="size-3.5 text-mint" />
          Submit a tool
        </div>
        <h1 className="font-display text-5xl sm:text-6xl tracking-tight leading-none">
          {launched ? "It's live! 🎉" : "Plant your tool"}
        </h1>
        <p className="mt-4 text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          {launched
            ? "Your tool is now live in the marketplace."
            : isLaunching
            ? "Launching your tool — just a few seconds…"
            : step === 1
            ? "Paste a URL — we'll scrape metadata and security-check it automatically."
            : step === 2
            ? "Add media, review the details, and continue."
            : "Customize how your card looks across the marketplace."}
        </p>
      </div>

      {/* Step indicator — hidden during launch and success */}
      {!isLaunching && !launched && (
        <StepIndicator current={step} steps={STEP_LABELS} />
      )}

      {/* ── STEP 1: URL + scrape ──────────────────────────────────────────── */}
      {step === 1 && !isLaunching && !launched && (
        <div className="bg-card border border-border rounded-3xl p-7 sm:p-10 sticker space-y-6">
          <div className="bg-muted/60 border border-border rounded-full p-1 flex max-w-xs mx-auto">
            <button
              onClick={() => setMode("auto")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
                mode === "auto" ? "bg-card shadow-sm sticker" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wand2 className="size-3.5" /> Auto
            </button>
            <button
              onClick={startManual}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
                mode === "manual" ? "bg-card shadow-sm sticker" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Pencil className="size-3.5" /> Manual
            </button>
          </div>

          <div>
            <label className="text-sm font-semibold tracking-tight block mb-2">Tool URL</label>
            <div className="flex items-center gap-2 rounded-2xl border border-border/80 focus-within:border-foreground/25 focus-within:ring-1 focus-within:ring-foreground/10 bg-background px-4 transition-all">
              <Link2 className="size-4 text-muted-foreground/60 shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="https://yourtool.com"
                className="flex-1 py-3.5 bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground/70 leading-relaxed">
              We'll scrape the title, favicon, and description, then run a security check.
            </p>
          </div>

          <button
            onClick={() => handleFetch()}
            disabled={fetching}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3.5 font-semibold sticker hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0 text-sm"
          >
            {fetching ? (
              <><Loader2 className="size-4 animate-spin" /> Scanning & fetching…</>
            ) : (
              <>Continue <ChevronRight className="size-4" /></>
            )}
          </button>

          <button
            type="button"
            onClick={startManual}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition underline underline-offset-4"
          >
            Skip and fill in details manually
          </button>
        </div>
      )}

      {/* ── STEP 2: Details ──────────────────────────────────────────────── */}
      {step === 2 && !isLaunching && !launched && (
        <div className="bg-card border border-border rounded-3xl p-7 sm:p-10 sticker">
          <div className="space-y-6">
            <Field label="Tool URL" hint="Required · HTTPS only">
              <div className="flex items-center gap-2 rounded-2xl border border-border/80 focus-within:border-foreground/25 focus-within:ring-1 focus-within:ring-foreground/10 bg-background px-4 transition-all">
                <Link2 className="size-4 text-muted-foreground/60 shrink-0" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourtool.com"
                  className="flex-1 py-3 bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
                />
              </div>
            </Field>

            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tinyform" className={inputCls} />
            </Field>

            <Field label="Tagline" hint="120 chars max">
              <input
                value={tagline}
                maxLength={120}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Forms in 30 seconds, share anywhere"
                className={inputCls}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                rows={4}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does it do? Who's it for? Why does it exist?"
                className={inputCls}
              />
            </Field>

            <Field label="Category">
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                {categoryOptions.map((c: ApiCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            <div className="pt-4 border-t border-border/40 space-y-6">
              <div>
                <p className="text-sm font-semibold tracking-tight mb-0.5">
                  Media{" "}
                  <span className="font-normal text-muted-foreground text-xs">optional</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Screenshots and a demo video help users understand your tool at a glance.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Screenshots</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{screenshotFiles.length} / {MAX_SCREENSHOTS}</span>
                </div>
                <ScreenshotDropzone files={screenshotFiles} onFilesChange={setScreenshotFiles} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Demo Video</span>
                <VideoDropzone file={videoFile} onFileChange={setVideoFile} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-full bg-muted border border-border font-medium hover:bg-muted/70 text-sm transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!name.trim() || !tagline.trim()) { toast.error("Name and tagline are required"); return; }
                  setStep(3);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3 font-semibold sticker hover:-translate-y-0.5 transition text-sm"
              >
                Looks good — continue <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Polish It + submit ────────────────────────────────────── */}
      {step === 3 && !isLaunching && !launched && (
        <div className="bg-card border border-border rounded-3xl p-7 sm:p-10 sticker space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-soft border border-mint/20 text-mint text-xs font-medium mb-4">
                <Wand2 className="size-3" /> Card studio
              </div>
              <h2 className="font-semibold text-2xl tracking-tight leading-snug">
                This is your baby.{" "}
                <span className="text-muted-foreground font-normal">Take 30 seconds to polish it.</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Customize how your listing card appears across the marketplace — changes reflect instantly.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Live Preview</p>
              <AppPreviewCard name={name} tagline={tagline} iconUrl={iconUrl} primaryColor={primaryColor} cardTheme={cardTheme} />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Card Canvas</p>
              <div className="grid grid-cols-3 gap-3">
                {CARD_PRESETS.map((p) => {
                  const active = cardTheme === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCardTheme(p.id)}
                      className={`relative rounded-2xl border-2 p-3.5 text-left transition-all duration-200 ${
                        active ? "border-primary/70 ring-1 ring-primary/20 bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`w-full h-7 rounded-lg mb-2.5 border ${p.swatch}`} />
                      <p className="text-xs font-semibold leading-tight tracking-tight">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                      {active && (
                        <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary grid place-items-center">
                          <Check className="size-2.5 text-background" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Accent Color</p>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="size-11 rounded-xl border border-border cursor-pointer bg-transparent shrink-0 overflow-hidden"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => { const v = e.target.value; if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v); }}
                  placeholder="#14b8a6"
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            {/* Anonymous toggle */}
            <div className="pt-4 border-t border-border/40">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="shrink-0">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 rounded-md border-2 grid place-items-center transition-all ${
                      anonymous ? "bg-foreground border-foreground" : "border-border bg-background group-hover:border-foreground/40"
                    }`}
                  >
                    {anonymous && (
                      <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-tight">Publish anonymously</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Your name and profile won't appear on the public listing.</div>
                </div>
              </label>
            </div>

            {/* Terms */}
            <div className="border-t border-border/40 pt-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`size-5 rounded-md border-2 grid place-items-center transition-all ${
                      agreedToTerms ? "bg-foreground border-foreground" : "border-border bg-background group-hover:border-foreground/40"
                    }`}
                  >
                    {agreedToTerms && (
                      <svg className="size-3 text-background" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="text-sm leading-relaxed">
                  <span className="flex items-center gap-1.5 font-semibold tracking-tight mb-1">
                    <Shield className="size-3.5 text-mint" />
                    I agree to the terms & conditions
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    By submitting, you confirm this tool is original, complies with our{" "}
                    <span className="text-foreground cursor-pointer hover:underline">community guidelines</span>,
                    and does not contain malicious or adult content.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-full bg-muted border border-border font-medium hover:bg-muted/70 text-sm transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!agreedToTerms}
                className="flex-1 rounded-full bg-foreground text-background py-3 font-semibold sticker hover:-translate-y-0.5 transition disabled:opacity-40 disabled:translate-y-0 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 text-sm"
              >
                {!agreedToTerms ? "Agree to terms to continue" : <>Launch into the yard <Rocket className="size-4" /></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── LAUNCH PROGRESS ───────────────────────────────────────────────── */}
      {isLaunching && launchPhase && (
        <LaunchProgress
          phase={launchPhase}
          done={launchDone}
          hasScreenshots={screenshotFiles.length > 0}
          hasVideo={videoFile !== null}
        />
      )}

      {/* ── SUCCESS ───────────────────────────────────────────────────────── */}
      {launched && (
        <div className="bg-card border border-border rounded-3xl p-10 sticker text-center space-y-8">
          <div className="space-y-3">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Rocket className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Your tool is live!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Now visible in the Imagine marketplace.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <AppPreviewCard
              name={name}
              tagline={tagline}
              iconUrl={iconUrl}
              primaryColor={primaryColor}
              cardTheme={cardTheme}
            />
          </div>

          <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
            <Link
              to="/tool/$toolId"
              params={{ toolId: launched.slug }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background py-3.5 font-semibold sticker hover:-translate-y-0.5 transition text-sm"
            >
              View your tool <ExternalLink className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setLaunched(null);
                setStep(1);
                setUrl(""); setName(""); setTagline(""); setDescription("");
                setScreenshotFiles([]); setVideoFile(null);
                setCardTheme("dark"); setPrimaryColor("#14b8a6");
                setLogoUrl(""); setIconUrl("");
                setAgreedToTerms(false); setAnonymous(false);
                setLaunchDone([]);
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition underline underline-offset-4"
            >
              Submit another tool
            </button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            Auto-navigating to your tool in {countdown}s…
          </p>
        </div>
      )}
    </div>
  );
}
