import { MythicVideoEffect } from "./MythicVideoEffect";

export function HissEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/hiss.mp4" onComplete={onComplete} />;
}
