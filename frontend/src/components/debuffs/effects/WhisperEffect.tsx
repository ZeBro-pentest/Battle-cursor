import { MythicVideoEffect } from "./MythicVideoEffect";

export function WhisperEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/whisper.mp4" onComplete={onComplete} />;
}
