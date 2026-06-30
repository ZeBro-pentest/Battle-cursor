import { useRef, useEffect } from "react";

export function RickrollEffect({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div className="effect-rickroll">
      <video
        ref={videoRef}
        src="/sounds/rickroll.mp4"
        className="effect-rickroll-video"
        autoPlay
        onEnded={onComplete}
        playsInline
      />
    </div>
  );
}
