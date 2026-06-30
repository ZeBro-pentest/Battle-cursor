import { MythicVideoEffect } from "./MythicVideoEffect";

export function EchoEffect({ onComplete }: { onComplete: () => void }) {
  return <MythicVideoEffect src="/sounds/echo.mp4" onComplete={onComplete} />;
}
