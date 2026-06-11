import { createFileRoute, Link } from "@tanstack/react-router";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, Sparkles, Rocket, Menu, X, Check, Star, Zap } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import IntroAnimation from "@/components/IntroAnimation";
import { GlobeInteractive } from "@/components/GlobeInteractive";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/landing")({
  component: LandingPage,
});

// ── Design tokens ─────────────────────────────────────────────────────────────
// Cozy dark: warm plum-black base, lavender + honey + soft rose accents,
// sentence-case headlines with an italic serif accent line. No cold cyan,
// no outlined display type, no shouting caps.

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INK = "#0f0a0e";
const LAVENDER = "#a78bfa";
const VIOLET = "#8b5cf6";
const HONEY = "#f3c98b";
const ROSE = "#e8a0bf";
const SERIF = "'Instrument Serif', Georgia, serif";

const CTA_GRADIENT = `linear-gradient(135deg, ${VIOLET} 0%, #a855f7 60%, #c2649a 100%)`;
const HERO_GRADIENT = `linear-gradient(110deg, #c4b5fd 0%, ${HONEY} 45%, ${ROSE} 75%, #c4b5fd 100%)`;
const WARM_TEXT_GRADIENT = `linear-gradient(135deg, #c4b5fd 0%, ${HONEY} 100%)`;

// ── Global keyframes ──────────────────────────────────────────────────────────

function GlobalKeyframes() {
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      ::selection { background: rgba(167,139,250,0.4); color: #fff; }
      :focus-visible { outline: 2px solid rgba(167,139,250,0.7); outline-offset: 3px; }
      ::-webkit-scrollbar { width: 10px; }
      ::-webkit-scrollbar-track { background: ${INK}; }
      ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.22); border-radius: 8px; border: 2px solid ${INK}; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.4); }
      @keyframes shimmer {
        0%   { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      @keyframes scroll-cue {
        0%   { transform: scaleY(0); transform-origin: top; }
        45%  { transform: scaleY(1); transform-origin: top; }
        55%  { transform: scaleY(1); transform-origin: bottom; }
        100% { transform: scaleY(0); transform-origin: bottom; }
      }
      @keyframes preloader-glow {
        0%, 100% { opacity: 0.7; }
        50%      { opacity: 1;   }
      }
      @keyframes drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33%      { transform: translate(40px, -30px) scale(1.06); }
        66%      { transform: translate(-30px, 20px) scale(0.96); }
      }
      @keyframes float-y {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-12px); }
      }
      @keyframes twinkle {
        0%, 100% { opacity: 0.15; transform: scale(1); }
        50%      { opacity: 0.7;  transform: scale(1.4); }
      }
      .anim-shimmer    { animation: shimmer 9s linear infinite; }
      .anim-scroll-cue { animation: scroll-cue 2.2s ease-in-out infinite; }
      .anim-drift      { animation: drift 22s ease-in-out infinite; }
      .anim-float      { animation: float-y 7s ease-in-out infinite; }
      .anim-twinkle    { animation: twinkle 4.5s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .anim-shimmer, .anim-scroll-cue, .anim-drift, .anim-float, .anim-twinkle { animation: none !important; }
      }
    `}</style>
  );
}

// ── Film grain overlay ────────────────────────────────────────────────────────

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function Grain() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ backgroundImage: `url("${NOISE_URI}")`, opacity: 0.04 }}
    />
  );
}

// ── Scroll progress bar ───────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[70] origin-left"
      style={{ scaleX, background: `linear-gradient(90deg, ${VIOLET}, ${LAVENDER}, ${HONEY})` }}
    />
  );
}

// ── Gradient hairline (section divider) ───────────────────────────────────────

function Hairline() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 inset-x-0 h-px"
      style={{
        background: `linear-gradient(90deg, transparent, rgba(167,139,250,0.28) 30%, rgba(243,201,139,0.18) 70%, transparent)`,
      }}
    />
  );
}

// ── Section tag ───────────────────────────────────────────────────────────────

function SectionTag({ n, label, className = "" }: { n: string; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className="h-px w-8" style={{ background: `linear-gradient(90deg, ${LAVENDER}, transparent)` }} />
      <p className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: "rgba(196,181,253,0.75)" }}>
        {n} — {label}
      </p>
    </div>
  );
}

// ── Magnetic hover ────────────────────────────────────────────────────────────
// Wrap a CTA: the element is gently pulled toward the cursor and springs back.

function Magnetic({ children, strength = 0.22 }: { children: React.ReactNode; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 180, damping: 16 });
  const sy = useSpring(y, { stiffness: 180, damping: 16 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div className="inline-block" style={{ x: sx, y: sy }} onMouseMove={onMouseMove} onMouseLeave={reset}>
      {children}
    </motion.div>
  );
}

// ── Button shine sweep ────────────────────────────────────────────────────────
// Parent needs: group relative overflow-hidden.

function Shine() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
      style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)" }}
    />
  );
}

// ── Line-mask heading reveal ──────────────────────────────────────────────────
// Each line slides up from behind an overflow mask with a slight settle
// rotation. `serif` lines render in italic Instrument Serif — the warm accent.

type RevealLine = { text: string; gradient?: string; serif?: boolean };

function RevealHeading({
  lines,
  className = "",
  style,
}: {
  lines: RevealLine[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  return (
    <h2 className={className} style={style}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden py-[0.12em] -my-[0.12em]">
          <motion.span
            className="block will-change-transform"
            initial={reduce ? { opacity: 0 } : { y: "115%", rotate: 2.5 }}
            whileInView={reduce ? { opacity: 1 } : { y: "0%", rotate: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
            style={{
              transformOrigin: "left bottom",
              ...(line.serif
                ? { fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, letterSpacing: "-0.01em" }
                : {}),
              ...(line.gradient
                ? {
                    backgroundImage: line.gradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : {}),
            }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </h2>
  );
}

// ── Count-up number ───────────────────────────────────────────────────────────

function CountUp({
  from = 0,
  to,
  suffix = "",
  duration = 1.8,
}: {
  from?: number;
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [val, setVal] = useState(reduce ? to : from);

  useEffect(() => {
    if (!inView || reduce) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, duration, reduce]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ── Cursor aurora ─────────────────────────────────────────────────────────────
// Warm lamp-light: fast lavender layer + lagging honey layer.

function CursorAurora() {
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(-800);
  const my = useMotionValue(-800);

  const fx = useSpring(mx, { stiffness: 80, damping: 22 });
  const fy = useSpring(my, { stiffness: 80, damping: 22 });
  const sx = useSpring(mx, { stiffness: 28, damping: 18 });
  const sy = useSpring(my, { stiffness: 28, damping: 18 });

  useEffect(() => {
    if (reduceMotion) return;
    const fn = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [mx, my, reduceMotion]);

  const lavender = useMotionTemplate`radial-gradient(700px circle at ${fx}px ${fy}px, rgba(139,92,246,0.13) 0%, rgba(167,139,250,0.05) 45%, transparent 70%)`;
  const honey = useMotionTemplate`radial-gradient(900px circle at ${sx}px ${sy}px, rgba(243,201,139,0.06) 0%, transparent 60%)`;

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full opacity-40 anim-drift"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 65%)" }} />
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30 anim-drift"
          style={{ background: "radial-gradient(circle, rgba(243,201,139,0.08) 0%, transparent 65%)", animationDelay: "-7s" }} />
        <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] rounded-full opacity-20 anim-drift"
          style={{ background: "radial-gradient(circle, rgba(232,160,191,0.07) 0%, transparent 60%)", animationDelay: "-14s" }} />
      </div>
      {!reduceMotion && (
        <>
          <motion.div className="fixed inset-0 z-0 pointer-events-none" style={{ background: lavender }} />
          <motion.div className="fixed inset-0 z-0 pointer-events-none" style={{ background: honey }} />
        </>
      )}
    </>
  );
}

// ── Preloader ─────────────────────────────────────────────────────────────────

function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const done = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const DURATION = 1100;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / DURATION) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(done, 260);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
      style={{ background: INK }}
      exit={{ opacity: 0, transition: { duration: 0.55, ease: EASE } }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 52%, rgba(139,92,246,0.16) 0%, rgba(243,201,139,0.06) 55%, transparent 100%)",
          animation: "preloader-glow 2.8s ease-in-out infinite",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, filter: "blur(16px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.75, ease: EASE }}
      >
        <ImagineLogo size="xl" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-14 relative overflow-hidden rounded-full"
        style={{ width: 160, height: 1.5, background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${VIOLET}, ${LAVENDER} 50%, ${HONEY})`,
            boxShadow: "0 0 8px rgba(167,139,250,0.8)",
            transition: "width 0.04s linear",
          }}
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-4 font-mono text-[10px] tracking-[0.25em] text-stone-500"
      >
        {Math.round(progress)}%
      </motion.p>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const INTRO_KEY = "imagine-intro-seen";

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [introDone, setIntroDone] = useState(
    () => reduceMotion || sessionStorage.getItem(INTRO_KEY) === "1"
  );
  const [show, setShow] = useState(introDone);

  useEffect(() => {
    if (introDone && !show) { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }
  }, [introDone, show]);

  const finishIntro = useCallback(() => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setIntroDone(true);
  }, []);

  return (
    <div className="text-white overflow-x-hidden" style={{ background: INK }}>
      <GlobalKeyframes />
      <CursorAurora />
      <Grain />

      <AnimatePresence>
        {!introDone && <Preloader key="pre" onComplete={finishIntro} />}
      </AnimatePresence>

      {show && <ScrollProgress />}

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: show ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <Nav />
        <Hero play={show} />
        <WhyImagineFlow />
        <GlobalSection />
        <EcosystemSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
        <Footer />
      </motion.div>
    </div>
  );
}

// ── Imagine Logo ─────────────────────────────────────────────────────────────
// invert(1): white bg → black (invisible on dark page), teal ink → pinkish
// grayscale(1): flatten to gray
// brightness(1.6): push near-white → pure white

function ImagineLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const h = { sm: 40, md: 56, lg: 88, xl: 130 }[size];
  return (
    <img
      src="/logos/imagine-logo.png"
      alt="Imagine"
      draggable={false}
      style={{
        height: h,
        width: "auto",
        display: "block",
        flexShrink: 0,
        filter: "invert(1) grayscale(1) brightness(1.6)",
      }}
    />
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 40)), [scrollY]);

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "backdrop-blur-xl border-b border-white/[0.06]" : ""}`}
        style={{ background: scrolled ? "rgba(15,10,14,0.85)" : "transparent" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">

          <Link to="/" className="cursor-pointer transition-opacity hover:opacity-80">
            <ImagineLogo size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {[["Features","#features"],["Pricing","#pricing"],["FAQ","#faq"],["Explore","/trending"]].map(([l,h]) => (
              <a key={l} href={h} className="group relative text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400 hover:text-white transition-colors cursor-pointer">
                {l}
                <span aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                  style={{ background: `linear-gradient(90deg, ${LAVENDER}, ${HONEY})` }} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-flex text-[12px] font-medium text-stone-400 hover:text-white transition-colors px-3 py-2 cursor-pointer">
              Sign in
            </Link>
            <Link to="/submit"
              className="group relative overflow-hidden inline-flex items-center gap-1.5 text-white text-[12px] font-bold px-5 py-2.5 rounded-full transition-all tracking-tight cursor-pointer hover:shadow-[0_0_24px_rgba(167,139,250,0.4)]"
              style={{ background: CTA_GRADIENT }}
            >
              <Shine />
              Get started
            </Link>
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 hover:bg-white/10 rounded-lg cursor-pointer" aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 backdrop-blur-xl border-b border-white/[0.06] px-6 py-6 flex flex-col gap-5 md:hidden"
            style={{ background: "rgba(15,10,14,0.96)" }}
          >
            {[["Features","#features"],["Pricing","#pricing"],["FAQ","#faq"],["Explore","/trending"]].map(([l,h]) => (
              <a key={l} href={h}
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400 hover:text-white cursor-pointer"
                onClick={() => setOpen(false)}>{l}</a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ play }: { play: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const op = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  const maskLine = (delay: number) =>
    reduce
      ? {
          initial: { opacity: 0 },
          animate: play ? { opacity: 1 } : {},
          transition: { duration: 0.6, delay },
        }
      : {
          initial: { y: "115%" as const },
          animate: play ? { y: "0%" as const } : {},
          transition: { duration: 1.05, ease: EASE, delay },
        };

  return (
    <div ref={ref} className="relative min-h-screen flex items-center overflow-hidden">

      {/* Warm lamp light from above */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.1) 0%, rgba(243,201,139,0.04) 50%, transparent 75%)",
        }} />

      <motion.div style={{ y: reduce ? 0 : y, opacity: op }} className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-24 pb-20">

        {/* Floating device mockup — xl and up, sits behind the type */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: 50, rotate: 8 }}
          animate={play ? { opacity: 1, y: 0, rotate: 4 } : {}}
          transition={{ duration: 1.3, ease: EASE, delay: 0.8 }}
          className="hidden xl:block absolute right-4 top-24 -z-10 pointer-events-none select-none"
        >
          <div className="anim-float">
            <div className="relative w-[260px] rounded-[42px] border p-2"
              style={{
                borderColor: "rgba(167,139,250,0.25)",
                background: "rgba(19,13,18,0.92)",
                boxShadow: "0 40px 120px rgba(139,92,246,0.22), 0 0 0 1px rgba(255,255,255,0.03)",
              }}>
              <div className="rounded-[34px] overflow-hidden" style={{ background: "#171019" }}>
                {/* status bar */}
                <div className="flex items-center justify-between px-5 pt-3.5 pb-2">
                  <span className="text-[9px] font-bold text-stone-300">9:41</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="w-1 h-1 rounded-full bg-white/25" />
                    ))}
                  </div>
                </div>
                {/* banner */}
                <div className="mx-3 h-24 rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(243,201,139,0.18))" }} />
                {/* app row */}
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(243,201,139,0.25))", border: "1px solid rgba(167,139,250,0.4)" }}>
                    <Sparkles className="size-5 text-violet-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-stone-100">Loopnote</div>
                    <div className="text-[9px] text-stone-500">by Aisha · Productivity</div>
                  </div>
                  <span className="text-[9px] font-bold px-3 py-1.5 rounded-full text-white flex-shrink-0"
                    style={{ background: CTA_GRADIENT }}>
                    Install
                  </span>
                </div>
                {/* content bars */}
                <div className="px-4 pb-5 flex flex-col gap-2">
                  <div className="h-2.5 rounded-full bg-white/[0.06] w-full" />
                  <div className="h-2.5 rounded-full bg-white/[0.05] w-4/5" />
                  <div className="h-2.5 rounded-full bg-white/[0.04] w-3/5" />
                </div>
                {/* home indicator */}
                <div className="mx-auto mb-3 w-24 h-1 rounded-full bg-white/15" />
              </div>

              {/* floating glass chips */}
              <div className="absolute -left-20 top-20 anim-float flex items-center gap-1.5 px-3 py-2 rounded-full border backdrop-blur-md"
                style={{ borderColor: "rgba(243,201,139,0.25)", background: "rgba(243,201,139,0.08)", animationDelay: "-2s" }}>
                <Zap className="size-3" style={{ color: HONEY }} />
                <span className="text-[9px] font-bold" style={{ color: HONEY }}>Live in 10s</span>
              </div>
              <div className="absolute -right-8 bottom-24 anim-float flex items-center gap-1.5 px-3 py-2 rounded-full border backdrop-blur-md"
                style={{ borderColor: "rgba(167,139,250,0.28)", background: "rgba(139,92,246,0.1)", animationDelay: "-4.5s" }}>
                <Check className="size-3" style={{ color: LAVENDER }} />
                <span className="text-[9px] font-bold" style={{ color: LAVENDER }}>0% commission</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero logo badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: "blur(12px)" }}
          animate={play ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-12"
        >
          <ImagineLogo size="lg" />
        </motion.div>

        {/* Animated badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{
            borderColor: "rgba(167,139,250,0.3)",
            background: "rgba(139,92,246,0.07)",
            color: LAVENDER,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: HONEY }} />
          01 — The app platform for AI builders
        </motion.div>

        {/* Headline — sentence case with italic serif accent line */}
        <h1
          className="font-bold tracking-tight leading-[0.98] mb-10"
          style={{ fontSize: "clamp(3.2rem, 9vw, 7.5rem)" }}
        >
          <span className="block overflow-hidden py-[0.12em] -my-[0.12em]">
            <motion.span className="block will-change-transform" {...maskLine(0.12)}>
              Your app,
            </motion.span>
          </span>
          <span className="block overflow-hidden py-[0.12em] -my-[0.12em]">
            <motion.span
              className="block will-change-transform anim-shimmer"
              {...maskLine(0.26)}
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 400,
                letterSpacing: "-0.01em",
                backgroundImage: HERO_GRADIENT,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              instantly mobile.
            </motion.span>
          </span>
        </h1>

        {/* Sub + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={play ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE, delay: 0.42 }}
            className="text-[16px] md:text-[18px] text-stone-400 leading-relaxed max-w-md font-medium"
          >
            Convert any URL into a premium mobile app — bypassing App Store review, zero commission, zero wait.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={play ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.52 }}
            className="flex items-center gap-5 flex-shrink-0"
          >
            <Magnetic>
              <Link to="/submit"
                className="group relative overflow-hidden inline-flex items-center gap-2 text-white font-bold text-[13px] px-8 py-4 rounded-full transition-all tracking-tight cursor-pointer hover:shadow-[0_0_40px_rgba(167,139,250,0.45)]"
                style={{ background: CTA_GRADIENT }}
              >
                <Shine />
                <Rocket className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> Launch free
              </Link>
            </Magnetic>
            <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-stone-400 hover:text-white transition-colors cursor-pointer">
              Browse <ArrowRight className="size-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.64 }}
          className="flex items-center gap-4 mt-12"
        >
          <div className="flex -space-x-2.5">
            {[
              ["MC", LAVENDER, "#c084fc"],
              ["DK", HONEY, ROSE],
              ["AB", ROSE, LAVENDER],
              ["TA", "#c4b5fd", HONEY],
              ["SM", LAVENDER, ROSE],
            ].map(([ini, c1, c2]) => (
              <div key={ini}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                style={{ borderColor: INK, background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                {ini}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="size-3" style={{ color: HONEY, fill: HONEY }} />
              ))}
            </div>
            <span className="text-[11px] text-stone-500 font-medium">Loved by 18,000+ builders</span>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={play ? { opacity: 1 } : {}}
          transition={{ delay: 0.72, duration: 0.9 }}
          className="relative flex flex-wrap gap-14 mt-24 pt-10"
        >
          <Hairline />
          {[["0%","Platform fees"],["10s","Time to launch"],["∞","Instant updates"],["0","App Store rules"]].map(([v,l]) => (
            <div key={l}>
              <div className="font-bold tracking-tight leading-none mb-1 bg-clip-text text-transparent"
                style={{ fontSize: "clamp(2rem,4vw,2.8rem)", backgroundImage: "linear-gradient(135deg, #f5f0ea 30%, #c4b5fd 100%)" }}>
                {v}
              </div>
              <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-stone-500">{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : {}}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-stone-500">Scroll</span>
        <div className="w-px h-10 overflow-hidden">
          <div className="w-px h-full anim-scroll-cue"
            style={{ background: `linear-gradient(to bottom, ${LAVENDER}, transparent)` }} />
        </div>
      </motion.div>

      <div className="absolute bottom-0 inset-x-0 h-40 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${INK}, transparent)` }} />
    </div>
  );
}

// ── Why Imagine — stacking rotation cards ─────────────────────────────────────

const URL_DEMOS = ["polymarket.com", "producthunt.com", "linear.app", "cal.com"];

function UrlVisual({ active }: { active: boolean }) {
  const [typed, setTyped] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const triggered = useRef(false);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || triggered.current) return;
    triggered.current = true;

    const runCycle = (idx: number) => {
      const DEMO = URL_DEMOS[idx % URL_DEMOS.length];
      setTyped("");
      setShowPhone(false);
      let i = 0;
      iv.current = setInterval(() => {
        i++;
        setTyped(DEMO.slice(0, i));
        if (i >= DEMO.length) {
          clearInterval(iv.current!);
          setTimeout(() => {
            setShowPhone(true);
            setTimeout(() => {
              setDemoIdx(idx + 1);
              runCycle(idx + 1);
            }, 2200);
          }, 350);
        }
      }, 65);
    };

    runCycle(0);
    return () => { if (iv.current) clearInterval(iv.current); };
  }, [active]);

  const currentDomain = URL_DEMOS[demoIdx % URL_DEMOS.length];
  const appName = currentDomain.split(".")[0];
  const appNameDisplay = appName.charAt(0).toUpperCase() + appName.slice(1);

  return (
    <div className="flex items-end gap-6 flex-wrap">
      {/* URL input + badge */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 border rounded-2xl px-5 py-4 min-w-[260px]"
          style={{ borderColor: "rgba(167,139,250,0.3)", background: "rgba(139,92,246,0.06)" }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: `linear-gradient(135deg, ${VIOLET}, ${HONEY})` }} />
          <span className="font-mono text-[14px] text-stone-200 min-w-[16ch] tracking-tight">
            {typed}<span className="inline-block w-[2px] h-[14px] bg-violet-400 ml-0.5 animate-pulse align-middle" />
          </span>
        </div>
        {/* "Live in" badge */}
        <motion.div
          animate={{ opacity: showPhone ? 1 : 0, y: showPhone ? 0 : 4 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full self-start"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 tracking-wide">Live in &lt; 10 seconds</span>
        </motion.div>
      </div>

      <motion.div animate={{ opacity: showPhone ? 1 : 0 }} transition={{ duration: 0.25 }}>
        <ArrowRight className="size-5 text-violet-400 mb-6" />
      </motion.div>

      {/* Phone */}
      <motion.div
        key={demoIdx}
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={showPhone ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.7, y: 20 }}
        transition={{ type: "spring", stiffness: 240, damping: 20 }}
      >
        <div className="w-[96px] h-[188px] rounded-[26px] border overflow-hidden relative"
          style={{
            borderColor: "rgba(167,139,250,0.4)",
            background: "#130d12",
            boxShadow: "0 24px 64px rgba(139,92,246,0.28), 0 0 0 0.5px rgba(167,139,250,0.25) inset",
          }}>
          {/* notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-9 h-1.5 rounded-full bg-white/10" />
          <div className="absolute inset-x-1 top-7 bottom-1 rounded-[20px] flex flex-col items-center justify-center gap-3 px-2" style={{ background: "#171019" }}>
            {/* App icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(243,201,139,0.25))", border: "1px solid rgba(167,139,250,0.4)", boxShadow: "0 8px 24px rgba(139,92,246,0.3)" }}>
              <Sparkles className="size-5 text-violet-300" />
            </div>
            <div>
              <div className="text-[8px] font-bold text-stone-200 text-center mb-0.5">{appNameDisplay}</div>
              <div className="text-[6px] text-stone-500 text-center">Add to Home Screen</div>
            </div>
            {/* Home-screen dots */}
            <div className="flex gap-1 mt-1">
              {[0,1,2].map(d => (
                <div key={d} className="w-1 h-1 rounded-full" style={{ background: d === 0 ? "rgba(167,139,250,0.8)" : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RulesVisual({ active }: { active: boolean }) {
  const rules = [
    "2-week review",
    "30% commission",
    "Rejection risk",
    "Region locks",
    "Update delays",
    "Policy theater",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: EASE }}
      className="grid grid-cols-3 gap-3 max-w-[420px]"
    >
      {rules.map((r, i) => (
        <motion.div
          key={r}
          initial={{ opacity: 0, y: 10 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.45, delay: i * 0.07, ease: EASE }}
          className="relative rounded-xl px-4 py-3.5 overflow-hidden"
          style={{ border: "1px solid rgba(232,160,191,0.2)", background: "rgba(232,160,191,0.05)" }}
        >
          {/* diagonal strike */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2"
            style={{ height: 1, background: "rgba(232,160,191,0.5)", transform: "rotate(-8deg) scaleX(1.2)" }} />
          <div className="text-[10px] font-semibold leading-snug" style={{ color: "rgba(232,160,191,0.55)" }}>{r}</div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Card accent colors: lavender, honey→rose, rose→lavender
const FLOW_ACCENT = [
  { from: LAVENDER, to: "#c084fc" },
  { from: HONEY, to: ROSE },
  { from: ROSE, to: LAVENDER },
];

const FLOW_CARDS = [
  {
    num: "01 / 03",
    headline: ["0% fees,", "bypass the tax."],
    body: "Apple takes 30% of every dollar you earn. We take nothing. Keep 100% of your revenue and ship directly to users — forever.",
  },
  {
    num: "02 / 03",
    headline: ["Launch in", "ten seconds."],
    body: "Paste any URL. In 10 seconds it's a full native-feel mobile app, live on your users' home screens.",
  },
  {
    num: "03 / 03",
    headline: ["No store,", "no rules."],
    body: "No 2-week review cycles. No arbitrary rejections. No policy theater. Ship when you want, update in real time.",
  },
];

function WhyImagineFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [card2Active, setCard2Active] = useState(false);
  const [card3Active, setCard3Active] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setCard2Active(true);
      setCard3Active(true);
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-flow-section]"));
    if (!sections.length) return;

    const triggers: ScrollTrigger[] = [];

    sections.forEach((section, i) => {
      gsap.set(section, { zIndex: i + 1 });
      const inner = section.querySelector<HTMLElement>(".flow-inner");
      if (!inner) return;

      if (i > 0) {
        gsap.set(inner, { rotation: 30, transformOrigin: "bottom left" });
        const tween = gsap.to(inner, {
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 25%",
            scrub: true,
            onEnter: () => {
              if (i === 1) setCard2Active(true);
              if (i === 2) setCard3Active(true);
            },
          },
        });
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }

      if (i < sections.length - 1) {
        triggers.push(
          ScrollTrigger.create({
            trigger: section,
            start: "bottom bottom",
            end: "bottom top",
            pin: true,
            pinSpacing: false,
          })
        );
      }
    });

    ScrollTrigger.refresh();
    return () => triggers.forEach((t) => t.kill());
  }, [reduceMotion]);

  return (
    <div ref={containerRef} id="features" className="relative">
      {FLOW_CARDS.map((card, i) => {
        const accent = FLOW_ACCENT[i];
        return (
          <div
            key={i}
            data-flow-section
            className="relative min-h-screen w-full overflow-hidden"
            style={{ background: INK }}
          >
            {/* Colored top accent rule */}
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.from} 30%, ${accent.to} 70%, transparent)` }} />

            {/* Ambient glow blob per card */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] pointer-events-none"
              style={{ background: `radial-gradient(circle at 0% 0%, ${accent.from}14 0%, transparent 60%)` }} />

            <div
              className="flow-inner relative flex min-h-screen w-full flex-col justify-between"
              style={{
                background: INK,
                padding: "clamp(1.5rem,5vw,3.5rem) clamp(1.5rem,5vw,4rem)",
                transformOrigin: "bottom left",
                willChange: "transform",
              }}
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.32em]"
                  style={{ color: accent.from + "cc" }}>
                  02 — Why Imagine
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-600">
                  {card.num}
                </p>
              </div>

              {/* Headline + body */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 my-auto py-16">
                <h2
                  className="font-bold tracking-tight leading-[0.98]"
                  style={{ fontSize: "clamp(3rem, 7.5vw, 7rem)" }}
                >
                  {card.headline[0]}
                  <br />
                  <span className="bg-clip-text text-transparent"
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontWeight: 400,
                      letterSpacing: "-0.01em",
                      backgroundImage: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
                    }}>
                    {card.headline[1]}
                  </span>
                </h2>
                <p className="text-[16px] md:text-[18px] text-stone-400 leading-relaxed max-w-sm font-medium lg:pb-3">
                  {card.body}
                </p>
              </div>

              {/* Bottom visual */}
              <div>
                {i === 0 && (
                  <div className="flex items-stretch gap-6">
                    {/* App Store column */}
                    <div className="flex flex-col gap-2 px-6 py-5 rounded-3xl border"
                      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-stone-500">App Store</div>
                      <div className="font-bold tracking-tight leading-none text-stone-600 line-through decoration-rose-400/50"
                        style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)" }}>$1,000</div>
                      <div className="text-[11px] font-semibold" style={{ color: "rgba(232,160,191,0.7)" }}>− $300 to Apple</div>
                      <div className="mt-1 font-bold tracking-tight text-stone-500"
                        style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)" }}>$700 <span className="text-sm font-normal text-stone-600">yours</span></div>
                    </div>

                    {/* divider */}
                    <div className="w-px self-stretch" style={{ background: `${accent.from}20` }} />

                    {/* Imagine column */}
                    <div className="flex flex-col gap-2 px-6 py-5 rounded-3xl border"
                      style={{ borderColor: `${accent.from}30`, background: `${accent.from}08` }}>
                      <div className="text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: `${accent.from}cc` }}>Imagine</div>
                      <div className="font-bold tracking-tight leading-none bg-clip-text text-transparent"
                        style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)", backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>$1,000</div>
                      <div className="text-[11px] font-semibold" style={{ color: `${accent.from}99` }}>$0 taken — ever</div>
                      <div className="mt-1 font-bold tracking-tight bg-clip-text text-transparent"
                        style={{ fontSize: "clamp(1.4rem,2.5vw,2rem)", backgroundImage: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}>
                        $1,000 <span className="text-sm font-normal text-stone-400">yours</span>
                      </div>
                    </div>
                  </div>
                )}
                {i === 1 && <UrlVisual active={card2Active} />}
                {i === 2 && <RulesVisual active={card3Active} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Global section ────────────────────────────────────────────────────────────

const GLOBE_MARKERS = [
  { id: "sf",        location: [37.78,  -122.44] as [number,number], name: "San Francisco", users: 2891 },
  { id: "ny",        location: [40.71,   -74.01] as [number,number], name: "New York",       users: 1843 },
  { id: "toronto",   location: [43.65,   -79.38] as [number,number], name: "Toronto",        users: 489  },
  { id: "london",    location: [51.51,    -0.13] as [number,number], name: "London",         users: 1204 },
  { id: "berlin",    location: [52.52,   13.41]  as [number,number], name: "Berlin",         users: 892  },
  { id: "tlv",       location: [32.08,   34.78]  as [number,number], name: "Tel Aviv",       users: 612  },
  { id: "dubai",     location: [25.20,   55.27]  as [number,number], name: "Dubai",          users: 734  },
  { id: "mumbai",    location: [19.08,   72.88]  as [number,number], name: "Mumbai",         users: 1567 },
  { id: "singapore", location: [ 1.35,  103.82]  as [number,number], name: "Singapore",      users: 876  },
  { id: "tokyo",     location: [35.68,  139.65]  as [number,number], name: "Tokyo",          users: 2103 },
  { id: "sydney",    location: [-33.87, 151.21]  as [number,number], name: "Sydney",         users: 445  },
  { id: "saopaulo",  location: [-23.55,  -46.63] as [number,number], name: "São Paulo",      users: 567  },
];

function GlobalSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yCopy = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const yGlobe = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section ref={ref} className="relative" style={{ background: INK }}>
      <Hairline />

      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <SectionTag n="03" label="Global reach" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-28 md:py-36 grid md:grid-cols-2 gap-16 md:gap-24 items-center">

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ y: reduce ? 0 : yCopy }}
          className="flex flex-col gap-6"
        >
          <RevealHeading
            className="font-bold tracking-tight leading-[1.02]"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}
            lines={[
              { text: "Global distribution,", gradient: "linear-gradient(135deg, #f5f0ea 0%, #c4b5fd 100%)" },
              { text: "unlimited scale.", serif: true, gradient: WARM_TEXT_GRADIENT },
            ]}
          />
          <p
            className="text-base leading-relaxed max-w-md"
            style={{ color: "rgba(245,240,234,0.5)" }}
          >
            Bypass regional lockdowns and App Store territory restrictions completely.
            With Imagine, you can unlock immediate global traffic, acquire users from
            every corner of the earth, and grow your application from day one.
          </p>

          {/* Region stats */}
          <div className="grid grid-cols-3 gap-4 mt-2">
            {[
              { label: "Countries", value: "190+" },
              { label: "Avg. launch", value: "< 60s" },
              { label: "Store tax", value: "0%" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-4 py-3 rounded-2xl border transition-colors duration-300 hover:border-violet-400/30"
                style={{
                  borderColor: "rgba(167,139,250,0.15)",
                  background: "rgba(139,92,246,0.05)",
                }}
              >
                <span
                  className="font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
                    background: WARM_TEXT_GRADIENT,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {value}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: "rgba(245,240,234,0.35)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1, ease: EASE, delay: 0.15 }}
          style={{ y: reduce ? 0 : yGlobe }}
          className="relative flex items-center justify-center"
        >
          {/* Glow ring behind globe */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(139,92,246,0.16) 0%, transparent 70%)",
            }}
          />
          <GlobeInteractive className="w-full max-w-[480px]" speed={0.004} markers={GLOBE_MARKERS} />
        </motion.div>
      </div>

      {/* bottom fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${INK}, transparent)` }}
      />
    </section>
  );
}

// ── Ecosystem section ─────────────────────────────────────────────────────────

function EcosystemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative" style={{ height: "78vh", minHeight: 520 }}>
      <Hairline />
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <SectionTag n="04" label="The ecosystem" />
      </div>

      {inView && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <IntroAnimation />
        </motion.div>
      )}

      <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none z-10"
        style={{ background: `linear-gradient(to top, ${INK}, transparent)` }} />
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

const STATS: Array<
  | { kind: "count"; from: number; to: number; suffix: string; label: string; g: [string, string] }
  | { kind: "static"; value: string; label: string; g: [string, string] }
> = [
  { kind: "count", from: 0, to: 10, suffix: "s", label: "Average launch time", g: [LAVENDER, "#c084fc"] },
  { kind: "count", from: 30, to: 0, suffix: "%", label: "Platform commission", g: [HONEY, ROSE] },
  { kind: "static", value: "∞", label: "Instant updates", g: [ROSE, LAVENDER] },
  { kind: "count", from: 0, to: 18, suffix: "K+", label: "Active builders", g: ["#c4b5fd", HONEY] },
];

function StatsSection() {
  return (
    <section className="relative py-28 px-6">
      <Hairline />
      <div className="max-w-7xl mx-auto">
        <SectionTag n="05" label="Numbers" className="mb-16" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.09 }}
            >
              <div className="font-bold tracking-tight leading-none mb-3 bg-clip-text text-transparent"
                style={{ fontSize: "clamp(3rem,6vw,4.5rem)", backgroundImage: `linear-gradient(135deg, ${s.g[0]}, ${s.g[1]})` }}>
                {s.kind === "count"
                  ? <CountUp from={s.from} to={s.to} suffix={s.suffix} />
                  : s.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Shipped my side project as a mobile app in literally one coffee break. The App Store wanted two weeks and a 30% cut for the same thing.",
    name: "Maya Chen", role: "Indie hacker", grad: [LAVENDER, "#c084fc"],
  },
  {
    quote: "We pushed 14 updates last month. Every single one was live instantly. Our old native app is still waiting on review #3.",
    name: "Daniel Kovač", role: "CTO, Driftboard", grad: [HONEY, ROSE],
  },
  {
    quote: "Keeping 100% of revenue changed our unit economics overnight. Imagine paid for itself before the trial ended.",
    name: "Aisha Bello", role: "Founder, Loopnote", grad: [ROSE, LAVENDER],
  },
  {
    quote: "My users in regions the App Store blocks can finally install the app. Global from day one, no lawyers involved.",
    name: "Tomer Avni", role: "Solo developer", grad: ["#c4b5fd", HONEY],
  },
  {
    quote: "The install flow is so smooth our conversion to home screen doubled compared to our old 'download on the App Store' funnel.",
    name: "Sofia Marquez", role: "Growth, Pulsewave", grad: [LAVENDER, ROSE],
  },
  {
    quote: "I rejected the rejection. Apple said no to our category — Imagine said 'paste your URL'. We're at 40K installs.",
    name: "James Okafor", role: "Founder, Betlytics", grad: [HONEY, "#c084fc"],
  },
];

function TestimonialCard({ t, i }: { t: (typeof TESTIMONIALS)[number]; i: number }) {
  // Warm light pool that follows the cursor across the card
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(340px circle at ${sx}px ${sy}px, rgba(243,201,139,0.07), transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };
  const onLeave = () => { mx.set(-400); my.set(-400); };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.08 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex flex-col justify-between gap-8 rounded-3xl border p-7 transition-all duration-300 hover:border-violet-400/30 hover:-translate-y-1"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
    >
      <motion.div aria-hidden="true"
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: spotlight }} />
      {/* top gradient hairline on hover */}
      <div aria-hidden="true"
        className="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${t.grad[0]}, transparent)` }} />
      <blockquote className="relative text-[14px] leading-relaxed text-stone-400 font-medium">
        &ldquo;{t.quote}&rdquo;
      </blockquote>
      <figcaption className="relative flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${t.grad[0]}, ${t.grad[1]})` }}
          aria-hidden="true"
        >
          {t.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="text-[12px] font-bold text-stone-200">{t.name}</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">{t.role}</div>
        </div>
      </figcaption>
    </motion.figure>
  );
}

function TestimonialsSection() {
  return (
    <section className="relative py-28 px-6">
      <Hairline />
      {/* warm wash */}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-[560px] h-[560px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(243,201,139,0.05) 0%, transparent 65%)" }} />
      <div className="max-w-7xl mx-auto">
        <SectionTag n="06" label="Builders" className="mb-16" />

        <RevealHeading
          className="font-bold tracking-tight leading-[0.98] mb-20"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
          lines={[
            { text: "Builders ship here." },
            { text: "Here's why.", serif: true, gradient: WARM_TEXT_GRADIENT },
          ]}
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} t={t} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

type Plan = {
  name: string;
  price: string;
  originalPrice?: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  freeNow?: boolean;
};

// Early access: every tier is genuinely free right now — analytics, API, all of it.
const PLANS: Plan[] = [
  {
    name: "Free", price: "$0", period: "forever", desc: "Ship your first web app",
    features: ["1 app listing", "PWA install flow", "Basic analytics", "Imagine marketplace"],
    cta: "Get started", popular: false,
  },
  {
    name: "Pro", price: "$0", originalPrice: "$12", period: "month", desc: "For serious builders",
    features: ["Unlimited apps", "Custom domain", "Advanced analytics", "Priority ranking", "Early access perks"],
    cta: "Start free trial", popular: true, freeNow: true,
  },
  {
    name: "Studio", price: "$0", originalPrice: "$39", period: "month", desc: "For teams & agencies",
    features: ["Everything in Pro", "Team members (10)", "White-label branding", "API access", "Dedicated support"],
    cta: "Start free trial", popular: false, freeNow: true,
  },
];

function PlanCard({ p, i }: { p: (typeof PLANS)[number]; i: number }) {
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const sx = useSpring(mx, { stiffness: 150, damping: 20 });
  const sy = useSpring(my, { stiffness: 150, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(360px circle at ${sx}px ${sy}px, rgba(167,139,250,0.08), transparent 70%)`;

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };
  const onLeave = () => { mx.set(-400); my.set(-400); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: EASE, delay: i * 0.1 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative transition-transform duration-300 hover:-translate-y-1"
    >
      <Card className="relative border rounded-3xl overflow-hidden h-full transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.015)",
          borderColor: p.popular ? "rgba(167,139,250,0.45)" : "rgba(255,255,255,0.07)",
          boxShadow: p.popular ? "0 0 60px rgba(139,92,246,0.13), 0 0 0 1px rgba(167,139,250,0.2)" : "none",
        }}>
        <motion.div aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: spotlight }} />
        {p.popular && (
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,rgba(167,139,250,0.8),rgba(243,201,139,0.6),transparent)` }} />
        )}
        <CardHeader className="px-7 pt-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]"
              style={{ color: p.popular ? LAVENDER : "rgba(255,255,255,0.3)" }}>{p.name}</p>
            {p.freeNow && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: "rgba(243,201,139,0.3)", background: "rgba(243,201,139,0.08)", color: HONEY }}>
                <Sparkles className="size-2.5" />
                Currently free
              </span>
            )}
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{ backgroundImage: p.popular ? WARM_TEXT_GRADIENT : "linear-gradient(135deg,#f5f0ea,#a8a29e)" }}>
              {p.price}
            </span>
            {p.originalPrice && (
              <span className="text-stone-500 line-through text-xl font-bold mb-1">{p.originalPrice}</span>
            )}
            <span className="text-stone-500 text-[13px] mb-1.5">/{p.period}</span>
          </div>
          <p className="text-[12px] text-stone-500">{p.desc}</p>
          {p.freeNow && (
            <p className="text-[11px] font-medium mt-1.5" style={{ color: "rgba(243,201,139,0.75)" }}>
              Free during early access — analytics, API, everything included.
            </p>
          )}
        </CardHeader>
        <CardContent className="px-7 pb-5">
          <ul className="space-y-2.5">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="size-3.5 mt-0.5 flex-shrink-0"
                  style={{ color: p.popular ? LAVENDER : "rgba(255,255,255,0.4)" }} />
                <span className="text-[12px] text-stone-400">{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="px-7 pb-7">
          <Link to="/submit"
            className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-bold transition-all cursor-pointer ${p.popular ? "group relative overflow-hidden" : ""}`}
            style={p.popular ? {
              background: CTA_GRADIENT,
              color: "#fff",
              boxShadow: "0 0 24px rgba(139,92,246,0.35)",
            } : {
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {p.popular && <Shine />}
            {p.cta} <ArrowRight className="size-3.5" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative py-28 px-6">
      <Hairline />
      {/* lavender wash */}
      <div aria-hidden="true" className="absolute -top-24 -left-24 w-[560px] h-[560px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)" }} />
      <div className="max-w-7xl mx-auto">
        <SectionTag n="07" label="Pricing" className="mb-16" />

        <RevealHeading
          className="font-bold tracking-tight leading-[0.98] mb-8"
          style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
          lines={[
            { text: "Simple pricing," },
            { text: "currently 100% free.", serif: true, gradient: WARM_TEXT_GRADIENT },
          ]}
        />

        {/* Early access banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border mb-14"
          style={{ borderColor: "rgba(243,201,139,0.3)", background: "rgba(243,201,139,0.06)" }}
        >
          <Sparkles className="size-4 flex-shrink-0" style={{ color: HONEY }} />
          <span className="text-[12px] font-bold leading-snug" style={{ color: HONEY }}>
            Early access — every plan is completely free right now. Analytics, API, everything.
          </span>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p, i) => (
            <PlanCard key={p.name} p={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "Is Imagine really free right now?",       a: "Yes — completely. During early access every plan, including Pro and Studio with advanced analytics and API access, is 100% free. No credit card, no hidden meter, no surprise invoice. When paid plans launch, early users will be told well in advance." },
  { q: "What exactly is Imagine?",                a: "Imagine converts any web URL into an installable mobile app experience — bypassing the App Store completely. Users get a home screen icon, full-screen experience, and instant updates." },
  { q: "How does bypassing the App Store work?",  a: "We use Progressive Web App (PWA) technology. Your existing website becomes installable directly from our marketplace to any iOS or Android device. No review, no 30% cut, no policies." },
  { q: "How long does it take to publish?",       a: "About 10 seconds. Paste your URL, we generate the app listing, and you're live. Users can install from your Imagine page immediately." },
  { q: "Do my users need to download anything?",  a: "No. Users tap 'Add to Home Screen' from the browser. It looks and feels like a native app — full screen, no browser chrome, works offline with caching." },
  { q: "Can I update my app after publishing?",   a: "Yes — instantly. Since your app runs from your URL, every deploy you push is live to all users immediately. No App Store update cycle ever." },
];

function FaqSection() {
  return (
    <section id="faq" className="relative py-28 px-6">
      <Hairline />
      {/* rose wash */}
      <div aria-hidden="true" className="absolute top-1/3 -right-24 w-[480px] h-[480px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,160,191,0.05) 0%, transparent 65%)" }} />
      <div className="max-w-7xl mx-auto">
        <SectionTag n="08" label="FAQ" className="mb-16" />

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Sticky left column: heading + support card */}
          <div className="lg:sticky lg:top-24 flex flex-col gap-10">
            <RevealHeading
              className="font-bold tracking-tight leading-[0.98]"
              style={{ fontSize: "clamp(2.6rem, 5vw, 5rem)" }}
              lines={[
                { text: "Questions" },
                { text: "& answers.", serif: true, gradient: WARM_TEXT_GRADIENT },
              ]}
            />

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
              className="text-[15px] text-stone-400 leading-relaxed max-w-sm"
            >
              Everything you need to know about shipping on Imagine.
              Short answers, no legal fog.
            </motion.p>

            {/* Still curious card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
              className="rounded-3xl border p-7 flex flex-col gap-3 max-w-sm transition-colors duration-300 hover:border-[rgba(243,201,139,0.35)]"
              style={{ borderColor: "rgba(243,201,139,0.2)", background: "rgba(243,201,139,0.04)" }}
            >
              <p
                className="bg-clip-text text-transparent"
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: "1.5rem",
                  backgroundImage: WARM_TEXT_GRADIENT,
                }}
              >
                Still curious?
              </p>
              <p className="text-[13px] text-stone-400 leading-relaxed">
                Can't find your answer here? We're real humans and we reply fast.
              </p>
              <Link to="/info"
                className="group inline-flex items-center gap-1.5 text-[12px] font-bold mt-1 cursor-pointer transition-colors"
                style={{ color: HONEY }}
              >
                Talk to us <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.06 }}
              >
                <AccordionItem value={`f${i}`}
                  className="group border rounded-2xl px-6 transition-all duration-300 bg-white/[0.015] border-violet-400/10 hover:border-violet-400/25 data-[state=open]:border-violet-400/40 data-[state=open]:bg-white/[0.03] data-[state=open]:shadow-[0_0_40px_rgba(139,92,246,0.08)]"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5 cursor-pointer">
                    <span className="flex items-start gap-4">
                      <span className="font-mono text-[10px] mt-1 text-stone-500 group-data-[state=open]:text-[#f3c98b] transition-colors duration-300">
                        0{i + 1}
                      </span>
                      <span className="text-[14px] font-bold text-white">{f.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-[13.5px] text-stone-400 pb-6 pl-9 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

const TWINKLES = [
  { left: "12%", top: "22%", delay: 0,   size: 3   },
  { left: "85%", top: "18%", delay: 1.2, size: 2   },
  { left: "70%", top: "62%", delay: 2.1, size: 2.5 },
  { left: "22%", top: "68%", delay: 0.7, size: 2   },
  { left: "50%", top: "10%", delay: 1.7, size: 2   },
  { left: "38%", top: "38%", delay: 2.6, size: 2   },
  { left: "92%", top: "45%", delay: 3.2, size: 2.5 },
];

const REASSURANCES = ["Free forever plan", "No credit card", "Live in 10 seconds"];

function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 0.94]);

  return (
    <section ref={ref} className="relative py-40 px-6 overflow-hidden">
      <Hairline />

      {/* Horizon rings rising behind the headline */}
      <div aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 -bottom-[560px] w-[1100px] h-[1100px] rounded-full pointer-events-none"
        style={{ border: "1px solid rgba(167,139,250,0.16)" }} />
      <div aria-hidden="true"
        className="absolute left-1/2 -translate-x-1/2 -bottom-[620px] w-[1400px] h-[1400px] rounded-full pointer-events-none"
        style={{ border: "1px solid rgba(167,139,250,0.08)" }} />

      {/* Warm fireplace glow rising from the bottom */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 55% at 50% 110%, rgba(139,92,246,0.18) 0%, rgba(243,201,139,0.06) 55%, transparent 80%)" }} />

      {/* Ember twinkles */}
      {TWINKLES.map((t, i) => (
        <span key={i} aria-hidden="true"
          className="absolute rounded-full anim-twinkle pointer-events-none"
          style={{
            left: t.left, top: t.top, width: t.size, height: t.size,
            background: HONEY, opacity: 0.2, animationDelay: `${t.delay}s`,
          }} />
      ))}

      <motion.div style={{ scale }} className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
        <div className="flex justify-center mb-14">
          <SectionTag n="09" label="Launch" />
        </div>

        <RevealHeading
          className="font-bold tracking-tight leading-[1.02] text-center"
          style={{ fontSize: "clamp(3rem, 7.5vw, 7rem)" }}
          lines={[
            { text: "Ship without" },
            { text: "permission.", serif: true, gradient: HERO_GRADIENT },
          ]}
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
          className="mt-7 text-[15px] md:text-base text-stone-400 max-w-md leading-relaxed"
        >
          Your app could be on someone's home screen before this
          page finishes scrolling.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-11"
        >
          <Magnetic strength={0.28}>
            <Link to="/submit"
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full text-white font-bold text-[14px] px-10 py-5 transition-all cursor-pointer hover:shadow-[0_0_60px_rgba(167,139,250,0.5)]"
              style={{ background: CTA_GRADIENT }}
            >
              <Shine />
              <Rocket className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> Launch free now
            </Link>
          </Magnetic>
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-stone-300 px-8 py-5 border border-white/10 bg-white/[0.02] hover:border-violet-400/40 hover:text-white transition-all cursor-pointer"
          >
            Explore apps <ArrowRight className="size-3.5" />
          </Link>
        </motion.div>

        {/* Reassurance row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mt-10"
        >
          {REASSURANCES.map((r) => (
            <span key={r} className="inline-flex items-center gap-2 text-[11px] font-medium text-stone-500">
              <Check className="size-3.5" style={{ color: HONEY }} />
              {r}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative py-20 px-6">
      <Hairline />
      <div className="max-w-7xl mx-auto">
        {/* Serif sign-off */}
        <p
          className="mb-16 bg-clip-text text-transparent"
          style={{
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            letterSpacing: "-0.01em",
            backgroundImage: WARM_TEXT_GRADIENT,
          }}
        >
          Imagine something better.
        </p>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-12">
          <ImagineLogo size="md" />

          <div className="grid grid-cols-3 gap-x-16 gap-y-2 text-[11px]">
            {[
              ["Browse", "/"], ["Trending", "/trending"], ["Submit", "/submit"],
              ["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"],
              ["About", "/info"], ["Privacy", "#"], ["Terms", "#"],
            ].map(([l, h]) => (
              <a key={l} href={h} className="text-stone-500 hover:text-stone-300 transition-colors cursor-pointer">{l}</a>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-600">
          <p>The open platform for web app distribution.</p>
          <p>© {new Date().getFullYear()} Imagine. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
