import { useRef, useState } from "react";

// ── Brand data ────────────────────────────────────────────────────────────────

interface Company {
  name: string;
  domain: string;
  logoSrc: string;
  brandColor: string;
  logoWhite?: boolean;
  logoInvert?: boolean; // invert black logo to white on dark bg
}

const sic = (s: string) => `https://cdn.simpleicons.org/${s}`;
const siw = (s: string) => `https://cdn.simpleicons.org/${s}/ffffff`;

const COMPANIES: Company[] = [
  { name: "Lovable",  domain: "lovable.dev",      logoSrc: "/logos/lovable.png",    brandColor: "#e879f9" },
  { name: "Bolt",     domain: "bolt.new",          logoSrc: "/logos/bolt.png",       brandColor: "#1389FD" },
  { name: "v0",       domain: "v0.dev",            logoSrc: "/logos/v0.png",         brandColor: "#a3a3a3", logoInvert: true },
  { name: "Replit",   domain: "replit.com",        logoSrc: "/logos/replit.png",     brandColor: "#F26207" },
  { name: "Base44",   domain: "base44.com",        logoSrc: "/logos/base44.png",     brandColor: "#f97316" },
  { name: "Shipfast", domain: "shipfa.st",         logoSrc: "/logos/shipfast.webp",  brandColor: "#f59e0b" },
  { name: "Cursor",   domain: "cursor.com",        logoSrc: sic("cursor"),           brandColor: "#a855f7" },
  { name: "Copilot",  domain: "github.com",        logoSrc: siw("githubcopilot"),    brandColor: "#6E40C9", logoWhite: true },
  { name: "Claude",   domain: "anthropic.com",     logoSrc: "/logos/claude.svg",     brandColor: "#D97706" },
  { name: "ChatGPT",  domain: "chatgpt.com",       logoSrc: sic("openai"),           brandColor: "#10A37F" },
  { name: "Gemini",   domain: "gemini.google.com", logoSrc: sic("googlegemini"),     brandColor: "#4285F4" },
  { name: "Vercel",   domain: "vercel.com",        logoSrc: siw("vercel"),           brandColor: "#e4e4e7", logoWhite: true },
  { name: "Supabase", domain: "supabase.com",      logoSrc: sic("supabase"),         brandColor: "#3ECF8E" },
  { name: "Railway",  domain: "railway.app",       logoSrc: siw("railway"),          brandColor: "#c026d3", logoWhite: true },
  { name: "Netlify",  domain: "netlify.com",       logoSrc: sic("netlify"),          brandColor: "#00C7B7" },
  { name: "GitHub",   domain: "github.com",        logoSrc: siw("github"),           brandColor: "#d4d4d8", logoWhite: true },
  { name: "Figma",    domain: "figma.com",         logoSrc: sic("figma"),            brandColor: "#F24E1E" },
  { name: "Linear",   domain: "linear.app",        logoSrc: sic("linear"),           brandColor: "#5E6AD2" },
];

// ── Rows ──────────────────────────────────────────────────────────────────────

const ROW_A = COMPANIES.slice(0, 6);
const ROW_B = COMPANIES.slice(6, 12);
const ROW_C = COMPANIES.slice(12);

function hex2rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Single pill card ──────────────────────────────────────────────────────────

function Pill({ company }: { company: Company }) {
  const [src, setSrc] = useState(company.logoSrc);
  const fbIdx = useRef(0);
  const fallbacks = [
    `https://logo.clearbit.com/${company.domain}`,
    `https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`,
  ];
  const onError = () => {
    const next = fallbacks[fbIdx.current++];
    if (next && next !== src) setSrc(next);
    else setSrc("");
  };

  const c = company.brandColor;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0 select-none"
      style={{
        background: `linear-gradient(135deg, ${hex2rgba(c, 0.10)} 0%, rgba(10,10,10,0.9) 100%)`,
        border: `1px solid ${hex2rgba(c, 0.22)}`,
        boxShadow: `0 0 0 0 transparent, inset 0 1px 0 ${hex2rgba(c, 0.12)}`,
        backdropFilter: "blur(12px)",
        minWidth: 148,
      }}
    >
      {/* Logo container */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: hex2rgba(c, 0.16),
          border: `1px solid ${hex2rgba(c, 0.25)}`,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={company.name}
            onError={onError}
            className="w-[18px] h-[18px] object-contain"
            style={{ filter: company.logoInvert ? "invert(1) brightness(1.2)" : company.logoWhite ? "brightness(1.3)" : "none" }}
          />
        ) : (
          <span className="text-[11px] font-black" style={{ color: c }}>
            {company.name[0]}
          </span>
        )}
      </div>

      {/* Name */}
      <span
        className="text-[13px] font-semibold leading-none"
        style={{ color: "rgba(255,255,255,0.82)" }}
      >
        {company.name}
      </span>

      {/* Subtle brand dot */}
      <div
        className="w-1.5 h-1.5 rounded-full ml-auto shrink-0"
        style={{ background: hex2rgba(c, 0.7) }}
      />
    </div>
  );
}

// ── Marquee row ───────────────────────────────────────────────────────────────

function MarqueeRow({
  companies,
  reverse = false,
  duration = 32,
}: {
  companies: Company[];
  reverse?: boolean;
  duration?: number;
}) {
  // Duplicate so the loop is seamless
  const items = [...companies, ...companies, ...companies];

  return (
    <div className="flex w-full overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
      <div
        className="flex gap-3"
        style={{
          animation: `marquee-${reverse ? "right" : "left"} ${duration}s linear infinite`,
          willChange: "transform",
        }}
      >
        {items.map((c, i) => (
          <Pill key={`${c.domain}-${i}`} company={c} />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function IntroAnimation() {
  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes marquee-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee-right {
          0%   { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="marquee"] { animation: none !important; }
        }
      `}</style>

      <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center gap-5">

        {/* Ambient glow behind rows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(109,40,217,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Heading */}
        <div className="text-center px-6 z-10 mb-2">
          <h3
            className="font-black tracking-tighter leading-none bg-clip-text text-transparent"
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
              backgroundImage: "linear-gradient(135deg, #f1f5f9 0%, #c4b5fd 50%, #67e8f9 100%)",
            }}
          >
            The vibe coding ecosystem.
          </h3>
          <p
            className="mt-2 text-[12px] font-medium"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Every tool builders trust — in one platform.
          </p>
        </div>

        {/* Row 1 — left */}
        <MarqueeRow companies={ROW_A} reverse={false} duration={38} />

        {/* Row 2 — right (opposite direction) */}
        <MarqueeRow companies={ROW_B} reverse={true} duration={48} />

        {/* Row 3 — left (faster) */}
        <MarqueeRow companies={ROW_C} reverse={false} duration={28} />
      </div>
    </>
  );
}
