import { MythicVideoEffect } from "./MythicVideoEffect";

export function ZombieEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/zombie.mp4" onComplete={onComplete} />;
}
