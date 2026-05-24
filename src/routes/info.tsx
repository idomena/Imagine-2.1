import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Rocket, Heart, ShieldCheck, Users, Zap, MessageCircle, Mail } from "lucide-react";
import { CloudsBackground } from "@/components/CloudsBackground";

export const Route = createFileRoute("/info")({
  component: InfoPage,
  head: () => ({
    meta: [
      { title: "About — Imagine" },
      { name: "description", content: "What Imagine is, who it's for, and how the cozy corner of the indie web works." },
      { property: "og:title", content: "About Imagine" },
      { property: "og:description", content: "A friendly marketplace for tiny tools, built by indie makers." },
    ],
  }),
});

function InfoPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <CloudsBackground />

      <section className="relative mx-auto max-w-3xl px-4 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-xs font-medium text-foreground/70 sticker">
          <Sparkles className="size-3.5 text-mint" />
          A cozier kind of marketplace
        </div>
        <h1 className="mt-6 font-display text-5xl sm:text-7xl leading-[0.95] tracking-[-0.02em]">
          We help tiny tools
          <br />
          <span className="italic text-mint">find their people.</span>
        </h1>
        <p className="mt-6 text-lg text-foreground/70 max-w-2xl mx-auto">
          Imagine is a small, hand-tended yard for indie tools. Drop a URL, get discovered, and meet the makers behind the apps you love.
        </p>
      </section>

      <section className="relative mx-auto max-w-5xl px-4 mt-6 grid md:grid-cols-3 gap-4">
        <Feature icon={<Zap />} title="Live in 10 seconds" body="Paste a URL — we auto-fetch the title, icon and description. No long forms." />
        <Feature icon={<Heart />} title="Cozy, not corporate" body="Upvotes from real makers. No paid placements, no growth-hacked feeds." />
        <Feature icon={<ShieldCheck />} title="Safe by default" body="Every submission is scanned and reviewed before it shows on the yard." />
      </section>

      <section className="relative mx-auto max-w-3xl px-4 mt-16">
        <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
        <ol className="mt-5 space-y-3">
          <Step n={1} title="Drop your URL" body="One field. We do the boring bits." />
          <Step n={2} title="Tidy your card" body="Tweak the tagline, pick tags, choose a category." />
          <Step n={3} title="Ship & celebrate" body="Your tool goes live. Share the link, gather upvotes, meet makers." />
        </ol>
      </section>

      <section className="relative mx-auto max-w-3xl px-4 mt-16">
        <h2 className="font-display text-3xl sm:text-4xl">FAQ</h2>
        <div className="mt-5 space-y-3">
          <Faq q="Is it free?" a="Yes, fully free for makers. We may add optional boosts later, but the yard itself stays free." />
          <Faq q="Who can submit?" a="Anyone with a working tool URL. Side-projects, weekend builds, polished products — all welcome." />
          <Faq q="How do upvotes work?" a="One upvote per maker per tool. No bots, no farms — we keep an eye on it." />
          <Faq q="Can I edit my tool later?" a="Absolutely. Head to your dashboard to update copy, tags or the live URL." />
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-4 my-16">
        <div className="rounded-3xl bg-primary sticker p-8 sm:p-12 text-center">
          <h2 className="font-display text-3xl sm:text-5xl">Got a question?</h2>
          <p className="mt-3 text-foreground/70">We read every message. Pinky promise.</p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <a
              href="mailto:hi@imagine.app"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold sticker hover:-translate-y-0.5 transition"
            >
              <Mail className="size-4" /> Email us
            </a>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 rounded-full bg-card sticker px-5 py-2.5 text-sm font-semibold hover:-translate-y-0.5 transition"
            >
              <Rocket className="size-4" /> Submit a tool
            </Link>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-foreground/60">
            <Users className="size-3.5" /> Made with care by 4 cozy makers
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-card sticker p-5">
      <div className="size-10 rounded-2xl bg-mint-soft grid place-items-center text-mint sticker">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl">{title}</h3>
      <p className="mt-1 text-sm text-foreground/70">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-2xl bg-card sticker p-4">
      <div className="size-10 shrink-0 rounded-full bg-mint text-mint-foreground grid place-items-center font-display text-xl">
        {n}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-foreground/70 mt-0.5">{body}</p>
      </div>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl bg-card sticker p-4">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-semibold">{q}</span>
        <MessageCircle className="size-4 text-mint group-open:rotate-12 transition" />
      </summary>
      <p className="mt-2 text-sm text-foreground/70">{a}</p>
    </details>
  );
}
