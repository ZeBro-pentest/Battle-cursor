import type React from "react";

export function VandalEffect(_props: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <div className="effect-vandal">
      <svg
        className="effect-vandal-svg"
        viewBox="0 0 570 560"
        preserveAspectRatio="none"
      >
        <line x1="285" y1="0"   x2="200" y2="280" stroke="rgba(0,0,0,0.75)" strokeWidth="2.5" />
        <line x1="200" y1="280" x2="90"  y2="560" stroke="rgba(0,0,0,0.6)"  strokeWidth="2"   />
        <line x1="200" y1="280" x2="360" y2="420" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" />
        <line x1="360" y1="420" x2="310" y2="560" stroke="rgba(0,0,0,0.4)"  strokeWidth="1"   />
        <line x1="285" y1="0"   x2="420" y2="140" stroke="rgba(0,0,0,0.5)"  strokeWidth="1.5" />
        <line x1="420" y1="140" x2="570" y2="190" stroke="rgba(0,0,0,0.4)"  strokeWidth="1"   />
        <line x1="420" y1="140" x2="460" y2="310" stroke="rgba(0,0,0,0.35)" strokeWidth="1"   />
      </svg>
    </div>
  );
}
