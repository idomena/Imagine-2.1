import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";
import { Rocket, Users } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 50; opacity: 0.04; mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-imagine {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
    color: #fff;
    text-shadow: 0 10px 30px rgba(255,255,255,0.12), 0 2px 4px rgba(255,255,255,0.08);
  }

  .text-silver-matte {
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.4) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0px 10px 20px rgba(255,255,255,0.12)) drop-shadow(0px 2px 4px rgba(255,255,255,0.08));
  }

  .text-card-silver-matte {
    background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transform: translateZ(0);
    filter: drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
    background: linear-gradient(145deg, #0d2a1a 0%, #050f0a 100%);
    box-shadow:
      0 40px 100px -20px rgba(0, 0, 0, 0.9),
      0 20px 40px -20px rgba(0, 0, 0, 0.8),
      inset 0 1px 2px rgba(255, 255, 255, 0.08),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(16, 185, 129, 0.08);
    position: relative;
  }

  .card-sheen {
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16,185,129,0.05) 0%, transparent 40%);
    mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .widget-depth {
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
    box-shadow: 0 10px 20px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -1px 1px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.04);
  }

  .floating-ui-badge {
    background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.01) 100%);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-modern-light, .btn-modern-dark {
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
  }
  .btn-modern-light {
    background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
    color: #0F172A;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
    transform: translateY(1px);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1);
  }
  .btn-modern-dark {
    background: linear-gradient(180deg, #27272A 0%, #18181B 100%);
    color: #FFFFFF;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:hover {
    transform: translateY(-3px);
    background: linear-gradient(180deg, #3F3F46 0%, #27272A 100%);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
    transform: translateY(1px);
    background: #18181B;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9);
  }

  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }
`;

const si = (slug: string) => `https://cdn.simpleicons.org/${slug}/ffffff`;

const LISTINGS = [
  { name: "Bolt",       desc: "AI full-stack code editor",  upvotes: "2,341", bg: "#0E0E1A", src: si("stackblitz"), hot: true  },
  { name: "Lovable",    desc: "Build beautiful apps fast",   upvotes: "1,892", bg: "#2D0A5A", src: "https://logo.clearbit.com/lovable.dev", hot: false },
  { name: "Cursor",     desc: "The AI-first IDE",            upvotes: "1,654", bg: "#111111", src: "https://logo.clearbit.com/cursor.com", hot: false },
  { name: "Replit",     desc: "Code from anywhere",          upvotes: "1,203", bg: "#0D101E", src: si("replit"), hot: false },
];

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  metricValue?: number;
}

export function CinematicHero({ metricValue = 2400, className, ...props }: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, { rotationY: xVal * 10, rotationX: -yVal * 10, ease: "power3.out", duration: 1.2 });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => { window.removeEventListener("mousemove", handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".imagine-text-track",  { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".imagine-text-days",   { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".imagine-main-card",   { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".imagine-card-left", ".imagine-card-right", ".imagine-mockup", ".imagine-badge", ".imagine-widget"], { autoAlpha: 0 });
      gsap.set(".imagine-cta",         { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      // Intro: taglines appear
      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".imagine-text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".imagine-text-days",  { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      // Scroll-driven cinematic timeline
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=5500",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".imagine-hero-wrapper", ".bg-grid-imagine"], { scale: 1.12, filter: "blur(18px)", opacity: 0.15, ease: "power2.inOut", duration: 2 }, 0)
        .to(".imagine-main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".imagine-main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".imagine-mockup",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".imagine-widget",
          { y: 40, autoAlpha: 0, scale: 0.95 },
          { y: 0, autoAlpha: 1, scale: 1, stagger: 0.12, ease: "back.out(1.2)", duration: 1.4 }, "-=1.5"
        )
        .to(".progress-ring",  { strokeDashoffset: 60,  duration: 2,   ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val",    { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".imagine-badge",
          { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 },
          { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0"
        )
        .fromTo(".imagine-card-left",  { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".imagine-card-right", { x:  50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2 })
        .set(".imagine-hero-wrapper", { autoAlpha: 0 })
        .set(".imagine-cta", { autoAlpha: 1 })
        .to({}, { duration: 1.5 })
        .to([".imagine-mockup", ".imagine-badge", ".imagine-card-left", ".imagine-card-right"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".imagine-main-card", {
          width:  isMobile ? "92vw" : "85vw",
          height: isMobile ? "92vh" : "85vh",
          borderRadius: isMobile ? "32px" : "40px",
          ease: "expo.inOut",
          duration: 1.8,
        }, "pullback")
        .to(".imagine-cta", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".imagine-main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-screen h-screen overflow-hidden flex items-center justify-center bg-zinc-950 text-zinc-100 font-sans antialiased",
        className
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-imagine absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* ── Background taglines ── */}
      <div className="imagine-hero-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <h1 className="imagine-text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          Discover. Launch.
        </h1>
        <h1 className="imagine-text-days gsap-reveal text-silver-matte text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          Scale your app.
        </h1>
      </div>

      {/* ── Final CTA ── */}
      <div className="imagine-cta absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 gsap-reveal pointer-events-auto will-change-transform">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight text-silver-matte">
          Ready to ship?
        </h2>
        <p className="text-zinc-400 text-base md:text-xl mb-10 max-w-xl mx-auto font-light leading-relaxed">
          Drop your URL. Go live in 10 seconds. Get in front of thousands of makers and early adopters — free.
        </p>
        <div className="flex flex-col sm:flex-row gap-5">
          <Link
            to="/submit"
            className="btn-modern-light flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] cursor-pointer"
          >
            <Rocket className="w-5 h-5 flex-shrink-0" />
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">Launch your tool</div>
              <div className="text-lg font-bold leading-none tracking-tight">Submit for free</div>
            </div>
          </Link>
          <Link
            to="/"
            className="btn-modern-dark flex items-center justify-center gap-3 px-8 py-4 rounded-[1.25rem] cursor-pointer"
          >
            <Users className="w-5 h-5 flex-shrink-0 text-zinc-400" />
            <div className="text-left">
              <div className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase">Join the community</div>
              <div className="text-lg font-bold leading-none tracking-tight">Browse marketplace</div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Main card ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="imagine-main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">

            {/* Right: brand name */}
            <div className="imagine-card-right gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h2 className="text-6xl md:text-[6rem] lg:text-[8rem] font-black uppercase tracking-tighter text-card-silver-matte">
                Imagine
              </h2>
            </div>

            {/* Center: browser mockup */}
            <div className="imagine-mockup order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center" style={{ perspective: "1000px" }}>
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-[0.85] lg:scale-100">
                <div
                  ref={mockupRef}
                  className="relative w-[360px] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Browser chrome */}
                  <div className="h-9 bg-zinc-900/80 flex items-center gap-2.5 px-3 border-b border-white/5">
                    <div className="flex gap-1.5 flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 mx-2">
                      <div className="w-full h-5 rounded bg-zinc-800/80 flex items-center px-2">
                        <span className="text-[9px] text-zinc-600 truncate">imagine.so/discover</span>
                      </div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="p-3 space-y-2">
                    {/* Mini header */}
                    <div className="imagine-widget flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-xs font-bold text-white tracking-tight">Imagine</span>
                      <div className="flex items-center gap-3 text-[9px]">
                        <span className="text-emerald-400 font-semibold">Trending</span>
                        <span className="text-zinc-500">New</span>
                        <span className="text-zinc-500">Top</span>
                      </div>
                    </div>

                    {/* Listing cards */}
                    {LISTINGS.map((item) => (
                      <div
                        key={item.name}
                        className="imagine-widget widget-depth flex items-center gap-2.5 p-2 rounded-xl"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: item.bg }}
                        >
                          <img
                            src={item.src}
                            alt={item.name}
                            className="w-4 h-4 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white truncate">{item.name}</p>
                          <p className="text-[9px] text-zinc-600 truncate">{item.desc}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-400">▲ {item.upvotes}</span>
                          {item.hot && (
                            <span className="text-[8px] bg-orange-500/20 text-orange-400 px-1 rounded font-semibold">Hot</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Animated counter ring */}
                    <div className="imagine-widget relative w-36 h-36 mx-auto flex items-center justify-center mt-1">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 144 144" aria-hidden="true">
                        <circle cx="72" cy="72" r="64" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                        <circle className="progress-ring" cx="72" cy="72" r="64" fill="none" stroke="#10b981" strokeWidth="10" />
                      </svg>
                      <div className="text-center z-10 flex flex-col items-center">
                        <span className="counter-val text-3xl font-extrabold tracking-tighter text-white">0</span>
                        <span className="text-[8px] text-emerald-400/60 uppercase tracking-[0.1em] font-bold mt-0.5">Apps Listed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="imagine-badge absolute flex top-4 lg:top-8 left-0 lg:-left-[80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 items-center gap-3 z-30">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-400/20">
                    <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold tracking-tight">Just Launched</p>
                    <p className="text-blue-200/50 text-[10px]">Bolt 2.0 is live on Imagine</p>
                  </div>
                </div>

                <div className="imagine-badge absolute flex bottom-8 lg:bottom-16 right-0 lg:-right-[80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 items-center gap-3 z-30">
                  <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-400/20">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold tracking-tight">18K+ Makers</p>
                    <p className="text-blue-200/50 text-[10px]">Active this week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left: pitch text */}
            <div className="imagine-card-left gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full lg:max-w-none px-4 lg:px-0">
              <h3 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-0 lg:mb-5 tracking-tight">
                Your app, discovered.
              </h3>
              <p className="hidden md:block text-emerald-100/60 text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none">
                <span className="text-white font-semibold">Imagine</span> is the marketplace where indie makers go live in seconds and get found by thousands of early adopters. Paste a URL. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
