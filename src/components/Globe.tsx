import { useEffect, useRef, useCallback, useState } from "react";
import createGlobe from "cobe";

interface GlobeMarker {
  id: string;
  location: [number, number];
  name: string;
  makers: number;
}

const MARKERS: GlobeMarker[] = [
  { id: "sf",      location: [37.78,  -122.44], name: "San Francisco", makers: 1420 },
  { id: "nyc",     location: [40.71,   -74.01], name: "New York",      makers: 980  },
  { id: "london",  location: [51.51,    -0.13], name: "London",        makers: 1102 },
  { id: "berlin",  location: [52.52,   13.41],  name: "Berlin",        makers: 734  },
  { id: "tokyo",   location: [35.68,  139.65],  name: "Tokyo",         makers: 891  },
  { id: "sydney",  location: [-33.87, 151.21],  name: "Sydney",        makers: 445  },
  { id: "sp",      location: [-23.55,  -46.63], name: "São Paulo",     makers: 567  },
  { id: "dubai",   location: [25.20,   55.27],  name: "Dubai",         makers: 398  },
  { id: "sg",      location: [1.35,   103.82],  name: "Singapore",     makers: 623  },
];

interface GlobeProps {
  className?: string;
}

export function Globe({ className = "" }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerInteracting.current) {
        dragOffset.current = {
          phi:   (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animId: number;
    let phi = 0;

    function init() {
      const w = canvas.offsetWidth;
      if (w === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: w, height: w,
        phi: 0, theta: 0.25,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 20000,
        mapBrightness: 5,
        baseColor:   [0.06, 0.09, 0.12],
        markerColor: [0.06, 0.73, 0.51],
        glowColor:   [0.04, 0.45, 0.32],
        markers: MARKERS.map((m) => ({ location: m.location, size: 0.028, id: m.id })),
        arcs: [
          { from: [37.78,  -122.44], to: [51.51,   -0.13]  },
          { from: [51.51,    -0.13], to: [52.52,   13.41]  },
          { from: [40.71,   -74.01], to: [-23.55, -46.63]  },
          { from: [35.68,  139.65],  to: [1.35,  103.82]   },
          { from: [37.78,  -122.44], to: [35.68,  139.65]  },
        ],
        arcColor: [0.06, 0.73, 0.51],
        arcWidth: 1.5,
        arcHeight: 0.35,
        opacity: 0.9,
      });

      function animate() {
        if (!isPausedRef.current) phi += 0.003;
        globe!.update({
          phi:   phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.25 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = "1"));
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) { ro.disconnect(); init(); }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (globe) globe.destroy();
    };
  }, []);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: "100%", height: "100%", cursor: "grab",
          opacity: 0, transition: "opacity 1.4s ease",
          borderRadius: "50%", touchAction: "none",
        }}
      />
      {/* Marker labels */}
      {MARKERS.map((m) => (
        <div
          key={m.id}
          onClick={() => setExpanded(expanded === m.id ? null : m.id)}
          style={{
            position: "absolute",
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 6,
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            padding: expanded === m.id ? "0.35rem 0.55rem" : "0.25rem 0.45rem",
            background: "rgba(9,9,11,0.85)",
            border: "1px solid rgba(16,185,129,0.3)",
            color: "#fff",
            borderRadius: 4,
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(16,185,129,0.15)",
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 6px))`,
            transition: "opacity 0.4s, filter 0.4s, padding 0.2s",
            zoom: expanded === m.id ? 1.05 : 1,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#34d399" }}>
            {m.name}
          </span>
          {expanded === m.id && (
            <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.6)", marginTop: "0.1rem" }}>
              {m.makers.toLocaleString()} makers
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
