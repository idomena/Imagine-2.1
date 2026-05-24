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
    <section className="relative overflow-hidden min-h-[80vh] grid place-items-center px-4 py-12">
      <CloudsBackground />
      <div className="absolute -top-10 -left-10 size-64 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute top-20 -right-10 size-72 rounded-full bg-mint/25 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-7">
          <h1 className="font-display text-5xl sm:text-6xl leading-[0.95] tracking-[-0.02em]">
            {mode === "login" ? "Welcome to " : "Join "}
            <span className="italic text-mint">Imagine</span>
          </h1>
          <p className="mt-3 text-foreground/70">
            {mode === "login"
              ? "Log in to ship, upvote and follow your favourite tiny tools."
              : "Create your maker account and ship your first tool today."}
          </p>
        </div>

        <div className="rounded-3xl bg-card sticker p-6 sm:p-7">
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-2xl bg-background/50 border border-border">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-primary text-foreground sticker" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`rounded-xl py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-primary text-foreground sticker" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]" />
          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="flex items-center gap-3 rounded-2xl bg-background sticker px-4 py-3">
                <UserIcon className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name (optional)"
                  autoComplete="name"
                  className="flex-1 bg-transparent outline-none text-sm min-w-0"
                />
              </label>
            )}

            <label className="flex items-center gap-3 rounded-2xl bg-background sticker px-4 py-3">
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
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-background sticker px-4 py-3">
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
                className="text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </label>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-foreground py-3 text-sm font-bold sticker hover:-translate-y-0.5 transition disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-foreground/70 mt-5">
          {mode === "login" ? (
            <>
              New around the yard?{" "}
              <button onClick={() => { setMode("signup"); setError(null); }} className="text-mint font-semibold hover:underline">
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
    </section>
  );
}
