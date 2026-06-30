import { MythicVideoEffect } from "./MythicVideoEffect";

export function GlitchEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/glitch.mp4" onComplete={onComplete} />;
}
