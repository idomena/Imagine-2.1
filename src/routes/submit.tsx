import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Link2, Sparkles, Loader2, Pencil, Wand2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCategories, type ApiCategory } from "@/hooks/use-apps";

export const Route = createFileRoute("/submit")({
  component: SubmitPage,
});

type Mode = "auto" | "manual";

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
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Set default category when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    const incomingUrl = (search as Record<string, unknown>).url as string;
    if (incomingUrl) handleAutoFetch(incomingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoFetch = async (incomingUrl: string) => {
    setFetching(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const normalized = incomingUrl.startsWith("http") ? incomingUrl : `https://${incomingUrl}`;
      const host = new URL(normalized).hostname.replace(/^www\./, "");
      const auto = host.split(".")[0];
      setUrl(normalized);
      setName(auto.charAt(0).toUpperCase() + auto.slice(1));
      setTagline("A delightful new tool");
      setDescription(`${auto} helps you do more with less. Built by an indie maker.`);
      setStep(2);
    } catch {
      // invalid URL
    } finally {
      setFetching(false);
    }
  };

  const handleFetch = async () => {
    if (!url) return toast.error("Paste your tool URL first");
    try { new URL(url.startsWith("http") ? url : `https://${url}`); }
    catch { return toast.error("That doesn't look like a valid URL"); }
    await handleAutoFetch(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return toast.error("Name and tagline are required");
    if (!url.trim()) return toast.error("A URL is required");

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http")) finalUrl = `https://${finalUrl}`;
    try { new URL(finalUrl); } catch { return toast.error("Invalid URL"); }

    if (finalUrl.startsWith("http://")) {
      return toast.error("URL must use HTTPS");
    }

    const slug = slugify(name.trim());
    if (!slug) return toast.error("Could not generate a slug from that name");

    setSubmitting(true);
    try {
      // Step 1: create draft
      const created = await apiFetch<{ id: string; slug: string }>("/api/v1/apps", {
        method: "POST",
        body: {
          slug,
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim() || undefined,
          launchUrl: finalUrl,
          categoryId: categoryId || undefined,
        },
      });

      // Step 2: submit for review/auto-publish
      await apiFetch(`/api/v1/apps/${created.id}/submit`, { method: "POST", body: {} });

      toast.success("Your tool is live! 🚀");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      // Slug conflict → try with a timestamp suffix
      if (msg.includes("already taken")) {
        toast.error("That name is already taken — try adding a word or number to make it unique.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium sticker">
          <Sparkles className="size-3.5 text-mint" />
          {mode === "auto" ? `Step ${step} of 2` : "Manual mode"}
        </div>
        <h1 className="mt-5 font-display text-5xl sm:text-6xl tracking-tight leading-none">
          Plant your tool
        </h1>
        <p className="mt-3 text-muted-foreground">
          {mode === "auto"
            ? "Paste a URL — we'll auto-fetch the rest."
            : "Fill in the details yourself. Full control."}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="bg-muted border border-border rounded-full p-1 flex mb-5 max-w-sm mx-auto">
        <button
          onClick={() => { setMode("auto"); setStep(1); }}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "auto" ? "bg-card sticker" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wand2 className="size-3.5" /> Auto from URL
        </button>
        <button
          onClick={startManual}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "manual" ? "bg-card sticker" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Pencil className="size-3.5" /> Manual
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticker">
        {mode === "auto" && step === 1 ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold">Tool URL</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20 bg-background px-3">
                <Link2 className="size-4 text-muted-foreground" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourtool.com"
                  className="flex-1 py-3 bg-transparent outline-none text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                We'll grab the title, favicon, and a starter description.
              </p>
            </label>
            <button
              onClick={handleFetch}
              disabled={fetching}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-foreground py-3 font-semibold sticker hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0"
            >
              {fetching ? <><Loader2 className="size-4 animate-spin" /> Fetching metadata…</> : "Continue →"}
            </button>
            <button
              type="button"
              onClick={startManual}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Or fill everything in manually
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Tool URL" hint="Required — must be HTTPS">
              <div className="flex items-center gap-2 rounded-2xl border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20 bg-background px-3">
                <Link2 className="size-4 text-muted-foreground" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourtool.com"
                  className="flex-1 py-2.5 bg-transparent outline-none text-sm"
                />
              </div>
            </Field>
            <Field label="Name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tinyform" className={inputCls} />
            </Field>
            <Field label="Tagline" hint="One line, 60 chars max">
              <input value={tagline} maxLength={60} onChange={(e) => setTagline(e.target.value)} placeholder="Forms in 30 seconds, share anywhere" className={inputCls} />
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
                {(categories ?? []).map((c: ApiCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                {(!categories || categories.length === 0) && (
                  <option value="">Loading categories…</option>
                )}
              </select>
            </Field>
            <div className="flex gap-2 pt-2">
              {mode === "auto" && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-full bg-card border border-border font-medium hover:bg-muted text-sm"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-primary text-foreground py-3 font-semibold sticker hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Launching…</> : "Launch into the yard 🚀"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
