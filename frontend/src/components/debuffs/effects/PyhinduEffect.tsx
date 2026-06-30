import { MythicVideoEffect } from "./MythicVideoEffect";

export function PyhinduEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/pyhindu.mp4" onComplete={onComplete} />;
}
