import { useRef, useEffect } from "react";

interface MythicVideoEffectProps {
  src: string;
  onComplete: () => void;
}

export function MythicVideoEffect({ src, onComplete }: MythicVideoEffectProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => onComplete());
  }, []);

  return (
    <div className="effect-mythic-video">
      <video
        ref={videoRef}
        src={src}
        className="effect-mythic-video-player"
        autoPlay
        onEnded={onComplete}
        playsInline
        muted={false}
      />
    </div>
  );
}
