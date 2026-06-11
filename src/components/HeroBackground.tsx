import { motion } from "framer-motion";

export function HeroBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage: "radial-gradient(circle, #71717a 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Orb 1 — emerald, top-left */}
      <motion.div
        className="absolute"
        style={{ width: 750, height: 750, left: "10%", top: "-20%" }}
        animate={{ x: [0, 70, -40, 0], y: [0, 90, 50, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full rounded-full bg-emerald-500/[0.09] blur-[130px]" />
      </motion.div>

      {/* Orb 2 — violet, top-right */}
      <motion.div
        className="absolute"
        style={{ width: 600, height: 600, right: "5%", top: "5%" }}
        animate={{ x: [0, -60, 25, 0], y: [0, 70, -30, 0], scale: [1, 0.91, 1.07, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <div className="w-full h-full rounded-full bg-violet-500/[0.08] blur-[110px]" />
      </motion.div>

      {/* Orb 3 — indigo, left-center */}
      <motion.div
        className="absolute"
        style={{ width: 480, height: 480, left: "3%", top: "45%" }}
        animate={{ x: [0, 90, 20, 0], y: [0, -50, 70, 0], scale: [1, 1.14, 0.93, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      >
        <div className="w-full h-full rounded-full bg-indigo-500/[0.07] blur-[100px]" />
      </motion.div>

      {/* Orb 4 — teal, bottom-right accent */}
      <motion.div
        className="absolute"
        style={{ width: 350, height: 350, right: "20%", bottom: "10%" }}
        animate={{ x: [0, -40, 60, 0], y: [0, -60, 20, 0], scale: [1, 1.1, 0.97, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 9 }}
      >
        <div className="w-full h-full rounded-full bg-teal-500/[0.06] blur-[80px]" />
      </motion.div>

      {/* Noise texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
        <filter id="noise-hero">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-hero)" />
      </svg>

      {/* Radial vignette — pulls focus to center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,transparent,rgba(9,9,11,0.7)_65%,rgba(9,9,11,0.97))]" />

      {/* Bottom fade into page */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />
    </div>
  );
}
