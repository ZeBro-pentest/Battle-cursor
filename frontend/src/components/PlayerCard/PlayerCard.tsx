import "./PlayerCard.css";
import type { Canvas, Cursor } from "../../types/user";

const RARITY_COLOR: Record<string, string> = {
  common: "#aaa",
  rare: "#4488ff",
  epic: "#aa44ee",
  mythic: "#FF0606",
  legendary: "#ffcc00",
};

interface Props {
  username: string;
  cursor: Cursor | null;
  canvas: Canvas | null;
  isHost: boolean;
  isCurrentUser: boolean;
}

export function PlayerCard({ username, cursor, canvas, isHost, isCurrentUser }: Props) {
  const hasFrame = !!canvas?.image_url;
  const color = (!hasFrame && canvas) ? (RARITY_COLOR[canvas.rarity] ?? "#aaa") : "#2a2a2a";

  return (
    <div className="pcard">
      <div
        className={`pcard-avatar${hasFrame ? " pcard-avatar--framed" : ""}`}
        style={{ "--pcard-color": color } as React.CSSProperties}
      >
        {cursor?.image_url ? (
          <img src={cursor.image_url} alt={cursor.name} className="pcard-img" />
        ) : (
          <svg className="pcard-svg" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="17" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {hasFrame && (
          <img src={canvas!.image_url!} alt="" className="pcard-frame" />
        )}
        {isHost && <span className="pcard-badge pcard-badge--host">HOST</span>}
        {isCurrentUser && !isHost && <span className="pcard-badge pcard-badge--you">YOU</span>}
      </div>
      <span className="pcard-name">{username}</span>
    </div>
  );
}

export function EmptyPlayerCard() {
  return (
    <div className="pcard pcard--empty">
      <div className="pcard-avatar pcard-avatar--empty">
        <span className="pcard-empty-mark">?</span>
      </div>
      <span className="pcard-name pcard-name--empty">—</span>
    </div>
  );
}
