"use client";

import { useMemo } from "react";

const PETAL_COUNT = 20;
const COLORS = ["#ffb7c5", "#ffc0cb", "#ffb7c5", "#ffd1dc", "#ffb7c5"];

function generatePetals() {
  return Array.from({ length: PETAL_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: 8 + Math.random() * 12,
    duration: 8 + Math.random() * 7,
    delay: Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

function SakuraPetal({
  left,
  size,
  duration,
  delay,
  color,
}: {
  left: string;
  size: number;
  duration: number;
  delay: number;
  color: string;
}) {
  return (
    <div
      className="absolute"
      style={{
        left,
        top: "-24px",
        width: size,
        height: size,
        animation: "sakura-fall linear infinite",
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-full w-full opacity-80">
        <path
          d="M12 0 Q15 5 12 12 Q9 5 12 0"
          fill={color}
          style={{
            animation: "sakura-spin linear infinite",
            animationDuration: `${duration * 0.5}s`,
            animationDelay: `${delay}s`,
          }}
        />
      </svg>
    </div>
  );
}

export function FallingCherryBlossoms() {
  const petals = useMemo(() => generatePetals(), []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[0] overflow-hidden"
      aria-hidden
    >
      {petals.map((p) => (
        <SakuraPetal
          key={p.id}
          left={p.left}
          size={p.size}
          duration={p.duration}
          delay={p.delay}
          color={p.color}
        />
      ))}
    </div>
  );
}
