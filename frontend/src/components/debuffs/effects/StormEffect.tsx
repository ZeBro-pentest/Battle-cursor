import { MythicVideoEffect } from "./MythicVideoEffect";

export function StormEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/storm.mp4" onComplete={onComplete} />;
}
