export function FlashEffect({ onComplete }: { onComplete: () => void }) {
  return <div className="effect-flash" onAnimationEnd={onComplete} />;
}
