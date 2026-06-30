import { MythicVideoEffect } from "./MythicVideoEffect";

export function BombsEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/bombs.mp4" onComplete={onComplete} />;
}
