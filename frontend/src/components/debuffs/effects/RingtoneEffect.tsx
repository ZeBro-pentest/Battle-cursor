import { MythicVideoEffect } from "./MythicVideoEffect";

export function RingtoneEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/ringtone.mp4" onComplete={onComplete} />;
}
