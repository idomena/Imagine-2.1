import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Rocket, Heart, TrendingUp, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { CloudsBackground } from "@/components/CloudsBackground";

export const Route = createFileRoute("/welcome-back")({
  component: WelcomeBackPage,
  head: () => ({
    meta: [
      { title: "Welcome back — Imagine" },
      { name: "description", content: "Pick up where you left off on Imagine." },
    ],
  }),
});

function WelcomeBackPage() {
  const { users, currentUserId, tools } = useStore();
  const me = users.find((u) => u.id === currentUserId)!;
  const myTools = tools.filter((t) => t.makerId === me.id);
  const totalUpvotes = myTools.reduce((a, t) => a + t.upvotes, 0);

  return (
    <section className="relative overflow-hidden min-h-[80vh] px-4 py-12">
      <div className="absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <CloudsBackground />
      <div className="absolute -top-10 -right-10 size-72 rounded-full bg-mint/25 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium text-foreground/70 sticker">
          <Sparkles className="size-3.5 text-mint" />
          Welcome back, {me.name.split(" ")[0]}
        </div>

        <h1 className="mt-5 font-display text-5xl sm:text-7xl leading-[0.95] tracking-[-0.02em]">
          Good to see you,
          <br />
          <span className="italic text-mint">{me.name.split(" ")[0]}</span>.
        </h1>
        <p className="mt-5 text-lg text-foreground/70 max-w-xl">
          Here's the cozy corner of the yard where your tools live. Want to ship something new today?
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-3">
          <StatCard icon={<Rocket className="size-4" />} label="Tools shipped" value={myTools.length} />
          <StatCard icon={<Heart className="size-4" />} label="Upvotes earned" value={totalUpvotes} />
          <StatCard icon={<TrendingUp className="size-4" />} label="Day streak" value={3} accent />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-foreground px-5 py-2.5 text-sm font-semibold sticker hover:-translate-y-0.5 transition"
          >
            <Rocket className="size-4" /> Ship a new tool
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-card sticker px-5 py-2.5 text-sm font-semibold hover:-translate-y-0.5 transition"
          >
            Open dashboard <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 rounded-3xl bg-card sticker p-6">
          <h2 className="font-display text-2xl">Pick up where you left off</h2>
          <ul className="mt-4 divide-y divide-border">
            {myTools.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.tagline}</p>
                </div>
                <Link
                  to="/tool/$toolId"
                  params={{ toolId: t.id }}
                  className="shrink-0 text-sm text-mint font-semibold hover:underline"
                >
                  Open →
                </Link>
              </li>
            ))}
            {myTools.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                No tools yet — your first one is just a URL away.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl sticker p-4 ${accent ? "bg-mint-soft" : "bg-card"}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
        <span className="text-mint">{icon}</span>
        {label}
      </div>
      <p className="font-display text-4xl mt-1">{value}</p>
    </div>
  );
}
