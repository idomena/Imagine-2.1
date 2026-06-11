import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mail, Lock, Rocket, User as UserIcon, Eye, EyeOff, Loader2 } from "lucide-react";
import { CloudsBackground } from "@/components/CloudsBackground";
import { useAuth } from "@/contexts/AuthContext";
import { loginWithGoogle } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — Imagine" },
      { name: "description", content: "Sign in to your Imagine maker account." },
    ],
  }),
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setError(null);
          try {
            await loginWithGoogle(response.credential);
            toast.success("Welcome to Imagine!");
            navigate({ to: "/dashboard" });
          } catch (err: any) {
            setError(err?.message ?? "Google sign-in failed. Please try again.");
          }
        },
      });
      if (googleBtnRef.current) {
        g.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          shape: "pill",
          theme: "outline",
          text: "continue_with",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 360,
          locale: "en",
        });
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogle();
    } else {
      window.addEventListener("google-loaded", initGoogle, { once: true });
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) script.addEventListener("load", initGoogle, { once: true });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await register(email, password, displayName || undefined);
        toast.success("Welcome to Imagine!");
      } else {
        await login(email, password);
        toast.success("Welcome back!");
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-5rem)] flex items-stretch">
      <CloudsBackground />

      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] shrink-0 bg-foreground text-background px-14 py-16 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-20 -left-20 size-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 size-96 rounded-full bg-mint/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 text-background/60 hover:text-background text-sm font-medium transition">
            ← Back to Imagine
          </Link>
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-background/40 mb-4">
            The indie maker yard
          </p>
          <h2 className="font-display text-5xl xl:text-6xl leading-[0.92] tracking-[-0.02em] text-background">
            Ship your tool.<br />
            <span className="italic text-primary">Get discovered.</span>
          </h2>
          <p className="mt-6 text-background/55 text-base leading-relaxed max-w-xs">
            Join thousands of indie makers who launch, track, and grow their tools here.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Paste a URL — live in 10 seconds",
              "Real-time analytics & visit tracking",
              "Community upvotes & reviews",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-background/70">
                <div className="size-5 rounded-full bg-primary/20 grid place-items-center shrink-0">
                  <Rocket className="size-2.5 text-primary" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-background/25">© 2026 Imagine</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="absolute -top-10 -left-10 size-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute top-20 -right-10 size-72 rounded-full bg-mint/15 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          {/* Mobile heading */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.02em]">
              {mode === "login" ? "Welcome back" : "Join "}
              <span className="italic text-mint">{mode === "login" ? "" : "Imagine"}</span>
            </h1>
            <p className="mt-2 text-sm text-foreground/60">
              {mode === "login" ? "Good to see you again." : "Start shipping in seconds."}
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-display text-4xl leading-tight tracking-tight">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="mt-1.5 text-sm text-foreground/60">
              {mode === "login"
                ? "Log in to your maker account."
                : "Your first tool is one minute away."}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-2xl bg-muted border border-border">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-card sticker text-foreground shadow-sm"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Google */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
                <Rocket className="size-4 shrink-0 text-mint" />
                Google sign-in — set <code className="bg-muted px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to enable.
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-1">or continue with email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-2.5" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="group flex items-center gap-3 rounded-2xl bg-background border border-border focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 px-4 py-3.5 transition-all">
                  <UserIcon className="size-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name (optional)"
                    autoComplete="name"
                    className="flex-1 bg-transparent outline-none text-sm min-w-0"
                  />
                </div>
              )}

              <div className="flex items-center gap-3 rounded-2xl bg-background border border-border focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 px-4 py-3.5 transition-all">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@cooltool.com"
                  autoComplete="email"
                  required
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-background border border-border focus-within:border-foreground/30 focus-within:ring-2 focus-within:ring-foreground/10 px-4 py-3.5 transition-all">
                <Lock className="size-4 text-muted-foreground shrink-0" />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  maxLength={72}
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/8 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background py-3.5 text-sm font-bold sticker hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer mt-1"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Rocket className="size-4" />
                )}
                {mode === "signup" ? "Create account — it's free" : "Log in"}
              </button>
            </form>

            <p className="text-center text-xs text-foreground/50 pt-1">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button onClick={() => { setMode("signup"); setError(null); }} className="text-mint font-semibold hover:underline cursor-pointer">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already a maker?{" "}
                  <Link to="/welcome-back" className="text-mint font-semibold hover:underline">
                    Welcome back →
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
