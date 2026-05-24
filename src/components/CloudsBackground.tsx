type CloudProps = {
  className?: string;
  style?: React.CSSProperties;
  variant?: 1 | 2 | 3 | 4;
  gradId: string;
};

function Cloud({ className, style, variant = 1, gradId }: CloudProps) {
  const paths: Record<number, string> = {
    1: "M30 72 Q26 50 52 50 Q58 30 84 34 Q108 24 118 48 Q142 46 140 70 Q140 86 122 86 L44 86 Q28 86 30 72 Z",
    2: "M18 64 Q16 44 40 44 Q48 26 70 30 Q90 20 102 40 Q122 38 126 60 Q142 60 138 78 Q138 90 120 90 L30 90 Q18 90 18 64 Z",
    3: "M24 70 Q20 48 46 48 Q52 30 78 34 Q102 26 112 48 Q136 48 132 72 Q132 86 114 86 L36 86 Q22 86 24 70 Z",
    4: "M28 66 Q24 46 50 48 Q56 30 80 34 Q98 26 110 44 Q132 44 134 64 Q150 66 146 80 Q146 92 128 92 L40 92 Q26 92 28 66 Z",
  };
  return (
    <svg viewBox="0 0 160 100" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="55%" stopColor="oklch(0.97 0.02 220)" stopOpacity="0.96" />
          <stop offset="100%" stopColor="oklch(0.88 0.05 250)" stopOpacity="0.78" />
        </linearGradient>
        <filter id={`${gradId}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      {/* soft halo */}
      <path
        d={paths[variant]}
        fill="white"
        opacity="0.55"
        transform="translate(2 4)"
        filter={`url(#${gradId}-soft)`}
      />
      <path
        d={paths[variant]}
        fill={`url(#${gradId})`}
        stroke="oklch(0.22 0.03 60)"
        strokeOpacity="0.08"
        strokeWidth="1.2"
      />
      {/* highlight */}
      <path
        d={paths[variant]}
        fill="white"
        opacity="0.35"
        transform="translate(0 -2) scale(0.96)"
        style={{ transformOrigin: "center", mixBlendMode: "screen" }}
      />
    </svg>
  );
}

type CloudSpec = {
  top: string;
  width: string;
  variant: 1 | 2 | 3 | 4;
  duration: number;
  delay: number;
  opacity: number;
  bobDur: number;
  shadow: string;
};

const CLOUDS: CloudSpec[] = [
  // background layer (small, slow but steady)
  { top: "5%",  width: "16%", variant: 1, duration: 55, delay: -10, opacity: 0.55, bobDur: 7,  shadow: "drop-shadow(0_4px_10px_oklch(0.22_0.03_60/0.05))" },
  { top: "13%", width: "13%", variant: 3, duration: 60, delay: -38, opacity: 0.5,  bobDur: 9,  shadow: "drop-shadow(0_4px_10px_oklch(0.22_0.03_60/0.05))" },
  // mid layer
  { top: "22%", width: "24%", variant: 2, duration: 38, delay: -8,  opacity: 0.85, bobDur: 6.5, shadow: "drop-shadow(0_10px_22px_oklch(0.22_0.03_60/0.1))" },
  { top: "44%", width: "20%", variant: 4, duration: 42, delay: -28, opacity: 0.8,  bobDur: 8,   shadow: "drop-shadow(0_10px_22px_oklch(0.22_0.03_60/0.1))" },
  { top: "32%", width: "27%", variant: 1, duration: 34, delay: -20, opacity: 0.9,  bobDur: 7.5, shadow: "drop-shadow(0_12px_26px_oklch(0.22_0.03_60/0.12))" },
  // near layer (big, fast, crisp)
  { top: "58%", width: "32%", variant: 3, duration: 26, delay: -6,  opacity: 1,    bobDur: 5.5, shadow: "drop-shadow(0_16px_30px_oklch(0.22_0.03_60/0.16))" },
  { top: "70%", width: "28%", variant: 2, duration: 30, delay: -18, opacity: 0.95, bobDur: 6,   shadow: "drop-shadow(0_16px_30px_oklch(0.22_0.03_60/0.16))" },
];

export function CloudsBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* sky wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.92 0.05 230 / 0.7) 0%, oklch(0.95 0.04 200 / 0.45) 35%, oklch(0.97 0.03 180 / 0.15) 65%, transparent 90%)",
        }}
      />
      {/* sun glow */}
      <div
        className="absolute -top-24 right-[12%] size-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.94 0.14 90 / 0.45) 0%, oklch(0.9 0.12 60 / 0.18) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <style>{`
        @keyframes cloud-drift {
          from { transform: translate3d(-40vw, 0, 0); }
          to   { transform: translate3d(140vw, 0, 0); }
        }
        @keyframes cloud-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes cloud-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        .cloud-layer {
          will-change: transform;
          animation-name: cloud-drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-fill-mode: both;
          animation-play-state: running;
        }
        .cloud-bob {
          animation: cloud-bob ease-in-out infinite;
          will-change: transform;
        }
      `}</style>

      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="cloud-layer absolute left-0"
          style={{
            top: c.top,
            width: c.width,
            opacity: c.opacity,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <div className="cloud-bob" style={{ animationDuration: `${c.bobDur}s` }}>
            <Cloud
              variant={c.variant}
              gradId={`cg-${i}`}
              className="w-full h-auto"
              style={{ filter: c.shadow }}
            />
          </div>
        </div>
      ))}

      {/* twinkles */}
      {[
        { top: "10%", left: "26%", d: 0,   s: 4.5, c: "oklch(0.78 0.14 175)" },
        { top: "28%", left: "76%", d: 1.2, s: 3.8, c: "oklch(0.86 0.16 92)" },
        { top: "50%", left: "10%", d: 2.4, s: 5,   c: "oklch(0.78 0.14 175)" },
        { top: "18%", left: "58%", d: 0.6, s: 4.2, c: "oklch(0.86 0.16 92)" },
        { top: "66%", left: "82%", d: 3,   s: 4.6, c: "oklch(0.78 0.14 175)" },
        { top: "38%", left: "44%", d: 1.8, s: 5.4, c: "oklch(0.86 0.16 92)" },
      ].map((t, i) => (
        <span
          key={i}
          className="absolute size-1.5 rounded-full"
          style={{
            top: t.top,
            left: t.left,
            background: t.c,
            animation: `cloud-twinkle ${t.s}s ease-in-out infinite`,
            animationDelay: `${t.d}s`,
            boxShadow: `0 0 14px ${t.c}`,
          }}
        />
      ))}
    </div>
  );
}
