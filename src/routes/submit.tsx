import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Link2, Sparkles, Loader2, Pencil, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { actions, CATEGORIES } from "@/lib/store";

export const Route = createFileRoute("/submit")({
  component: SubmitPage,
});

type Mode = "auto" | "manual";

function SubmitPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/submit" });
  const [mode, setMode] = useState<Mode>("auto");
  const [url, setUrl] = useState((search as Record<string, unknown>).url as string || "");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [tags, setTags] = useState("");
  const [fetching, setFetching] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const incomingUrl = (search as Record<string, unknown>).url as string;
    if (incomingUrl) handleAutoFetch(incomingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoFetch = async (incomingUrl: string) => {
    setFetching(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const host = new URL(incomingUrl.startsWith("http") ? incomingUrl : `https://${incomingUrl}`).hostname.replace(/^www\./, "");
      const auto = host.split(".")[0];
      setUrl(incomingUrl.startsWith("http") ? incomingUrl : `https://${incomingUrl}`);
      setName(auto.charAt(0).toUpperCase() + auto.slice(1));
      setTagline("A delightful new tool");
      setDescription(`${auto} helps you do more with less. Built by an indie maker.`);
      setStep(2);
    } catch {
      // invalid URL, stay on step 1
    } finally {
      setFetching(false);
    }
  };

  const handleFetch = async () => {
    if (!url) return toast.error("Paste your tool URL first");
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return toast.error("That doesn't look like a valid URL");
    }
    await handleAutoFetch(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return toast.error("Name and tagline are required");
    if (mode === "manual" && !url.trim()) return toast.error("A URL is required");
    let finalUrl = url.trim();
    if (finalUrl && !finalUrl.startsWith("http")) finalUrl = `https://${finalUrl}`;
    try { if (finalUrl) new URL(finalUrl); } catch { return toast.error("Invalid URL"); }
    const tool = actions.addTool({
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      url: finalUrl,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4),
    });
    toast.success("Your tool is live!");
    navigate({ to: "/tool/$toolId", params: { toolId: tool.id } });
  };

  const startManual = () => {
    setMode("manual");
    setStep(2);
  };

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
            <Field label="Tool URL" hint="Required">
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Tags" hint="Comma-separated">
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="AI, Notes" className={inputCls} />
              </Field>
            </div>
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
                className="flex-1 rounded-full bg-primary text-foreground py-3 font-semibold sticker hover:-translate-y-0.5 transition"
              >
                Launch into the yard 🚀
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
