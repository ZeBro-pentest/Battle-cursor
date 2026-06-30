import { MythicVideoEffect } from "./MythicVideoEffect";

export function SirenEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/siren.mp4" onComplete={onComplete} />;
}
