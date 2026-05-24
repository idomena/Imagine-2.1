import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, TrendingUp, Rocket, Users, Link2, Heart, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";

import { useStore, CATEGORIES } from "@/lib/store";
import { ToolCard } from "@/components/ToolCard";
import { CloudsBackground } from "@/components/CloudsBackground";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { tools } = useStore();
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tools
      .filter((t) => cat === "All" || t.category === cat || t.tags.includes(cat))
      .filter((t) =>
        q.trim() === ""
          ? true
          : (t.name + t.tagline + t.description + t.tags.join(" ")).toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => b.upvotes - a.upvotes);
  }, [tools, cat, q]);

  const topThree = [...tools].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <CloudsBackground />
        {/* floating blobs */}
        <div className="absolute -top-10 -left-10 size-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-20 -right-10 size-72 rounded-full bg-mint/25 blur-3xl" />


        <div className="relative mx-auto max-w-5xl px-4 pt-14 sm:pt-20 pb-12 sm:pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-[11px] sm:text-xs font-medium text-foreground/70 sticker">
            <Sparkles className="size-3.5 text-mint" />
            <span className="hidden sm:inline">New: paste any URL — your tool goes live in 10 seconds</span>
            <span className="sm:hidden">Paste a URL → live in 10s</span>
          </div>

          <h1 className="mt-6 sm:mt-7 font-display font-normal text-[3rem] leading-[0.95] sm:text-7xl sm:leading-[0.92] lg:text-[6rem] tracking-[-0.02em]">
            Discover & launch
            <br />
            <span className="italic text-mint">powerful apps</span>
          </h1>

          <p className="mt-6 sm:mt-8 text-base sm:text-xl text-foreground/70 max-w-xl mx-auto leading-relaxed px-2">
            The fastest way to ship your product and get discovered by thousands of makers & users.
          </p>


          <UrlPasteBar />

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/trending"
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-5 py-2.5 font-semibold hover:-translate-y-0.5 transition sticker"
            >
              <TrendingUp className="size-4" />
              See what's trending
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full text-foreground/70 hover:text-foreground px-3 py-2.5 font-medium transition"
            >
              Or open your dashboard →
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-7 text-sm text-foreground/60 flex-wrap">
            <Stat icon={<Rocket className="size-4" />} label={`${tools.length} tools live`} />
            <Stat icon={<Users className="size-4" />} label="4 cozy makers" />
            <Stat icon={<Heart className="size-4" />} label={`${tools.reduce((a, t) => a + t.upvotes, 0)} upvotes given`} />
          </div>
        </div>
      </section>

      {/* TOP 3 PODIUM */}
      <section className="mx-auto max-w-6xl px-4 mt-4">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-3xl flex items-center gap-2">
              <span className="text-2xl">🏆</span> Top of the yard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">The most-loved tools this week.</p>
          </div>
          <Link to="/trending" className="text-sm font-medium text-mint hover:underline">View all →</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {topThree.map((t, i) => (
            <ToolCard key={t.id} tool={t} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* FEED */}
      <section className="mx-auto max-w-6xl px-4 mt-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-3xl">Fresh from the yard</h2>
            <p className="text-sm text-muted-foreground mt-1">Brand-new tools, picked daily by the community.</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools, tags, makers…"
            className="px-4 py-2.5 rounded-full bg-card border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm w-full sm:w-72"
          />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition sticker ${
                cat === c
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground/70 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            No tools match. Why not <Link to="/submit" className="text-mint font-medium underline">submit one</Link>?
          </div>
        )}
      </section>

      {/* CTA BAND */}
      <section className="mx-auto max-w-6xl px-4 my-14 sm:my-20">
        <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] bg-primary sticker p-7 sm:p-14 text-center">
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl leading-tight tracking-tight">
            Not just build, <span className="text-mint">Scale it</span>
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-foreground/70 max-w-lg mx-auto">
            Drop your URL. We will take care of everything.
          </p>
          <Link
            to="/submit"
            className="mt-6 sm:mt-7 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold sticker hover:-translate-y-0.5 transition"
          >
            <Rocket className="size-4" />
            Submit your tool — it's free
          </Link>
        </div>
      </section>
    </div>
  );
}

function UrlPasteBar() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<null | { url: string; domain: string; title: string; description: string; favicon: string }>(null);
  const [loading, setLoading] = useState(false);

  const normalize = (raw: string) => {
    const v = raw.trim();
    if (!v) return null;
    try {
      return new URL(v.startsWith("http") ? v : `https://${v}`);
    } catch {
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = normalize(url);
    if (!u) return;
    setLoading(true);
    // Mock fetch — replace with real backend call later
    setTimeout(() => {
      const domain = u.hostname.replace(/^www\./, "");
      const title = domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      setPreview({
        url: u.toString(),
        domain,
        title,
        description: "A tiny tool worth shipping. Add a tagline on the next step.",
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      });
      setLoading(false);
    }, 700);
  };

  const reset = () => {
    setPreview(null);
    setUrl("");
  };

  const confirm = () => {
    if (!preview) return;
    navigate({ to: "/submit", search: { url: preview.url } });
  };

  if (preview) {
    return (
      <div className="mt-9 mx-auto max-w-xl w-full animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-3 rounded-2xl bg-card sticker px-4 py-3 min-w-0">
            <Link2 className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground/80 truncate">{preview.url}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl bg-card sticker px-4 py-3 text-sm font-semibold hover:-translate-y-0.5 transition"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>

        <div className="mt-3 rounded-3xl bg-card sticker p-5 text-left">
          <div className="flex items-start gap-4">
            <div className="size-14 rounded-2xl bg-background border border-border grid place-items-center shrink-0 overflow-hidden">
              <img
                src={preview.favicon}
                alt=""
                className="size-9 rounded-md"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-2xl leading-tight truncate">{preview.title}</h3>
              <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{preview.description}</p>
              <p className="text-xs text-mint mt-1.5 truncate">{preview.url}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-soft border border-mint/30 px-3 py-2.5">
            <ShieldCheck className="size-4 text-mint shrink-0" />
            <span className="text-xs font-semibold text-foreground/80">No threats detected</span>
          </div>

          <button
            type="button"
            onClick={confirm}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white sticker hover:-translate-y-0.5 transition"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.72 0.13 168), oklch(0.6 0.18 280))",
            }}
          >
            <Rocket className="size-4" />
            Confirm & Launch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-xl w-full mt-24">
      {/* Cozy hand-drawn pointer above-left of the URL bar */}
      <div className="pointer-events-none absolute -top-16 left-2 sm:-left-6 flex flex-col items-start animate-wiggle-point text-foreground">
        <span className="font-serif-italic italic text-sm sm:text-base leading-none whitespace-nowrap">
          psst… drop your link here
        </span>
        <svg
          viewBox="0 0 80 70"
          className="w-12 h-10 mt-1 ml-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4 C 10 24, 40 26, 56 60" />
          <path d="M46 54 L 56 60 L 52 49" />
        </svg>
      </div>





      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full bg-card sticker pl-5 pr-2 py-2 focus-within:-translate-y-0.5 transition"
      >
        <Link2 className="size-5 text-muted-foreground shrink-0" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-cool-tool.com"
          className="flex-1 bg-transparent outline-none text-sm min-w-0 py-2"
        />
        <button
          type="submit"
          disabled={!url || loading}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-5 py-2.5 text-sm font-semibold sticker hover:-translate-y-0.5 transition disabled:opacity-50 disabled:translate-y-0"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          {loading ? "Checking…" : "Launch it"}
        </button>
      </form>
    </div>
  );
}


function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-mint">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
