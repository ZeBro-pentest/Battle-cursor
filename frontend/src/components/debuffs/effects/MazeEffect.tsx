import { useState, useEffect, useCallback } from "react";

// true = стена, false = путь. Старт: [0][0], Финиш: [6][6]
const MAZE: boolean[][] = [
  [false, false, false, true,  false, false, false],
  [true,  true,  false, true,  false, true,  false],
  [false, false, false, false, false, true,  false],
  [false, true,  true,  true,  false, true,  false],
  [false, false, false, true,  false, false, false],
  [true,  false, true,  true,  true,  true,  false],
  [true,  false, false, false, false, false, false],
];

export function MazeEffect({ onComplete }: { onComplete: () => void }) {
  const [pos, setPos] = useState<[number, number]>([0, 0]);

  const move = useCallback((dr: number, dc: number) => {
    setPos(([r, c]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= 7 || nc < 0 || nc >= 7) return [r, c];
      if (MAZE[nr][nc]) return [r, c];
      return [nr, nc];
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "ArrowUp")    { e.preventDefault(); move(-1, 0); }
      if (e.key === "s" || e.key === "ArrowDown")  { e.preventDefault(); move(1, 0); }
      if (e.key === "a" || e.key === "ArrowLeft")  { e.preventDefault(); move(0, -1); }
      if (e.key === "d" || e.key === "ArrowRight") { e.preventDefault(); move(0, 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  useEffect(() => {
    if (pos[0] === 6 && pos[1] === 6) {
      setTimeout(onComplete, 400);
    }
  }, [pos, onComplete]);

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box effect-maze-box">
        <p className="effect-epic-title">Лабиринт</p>
        <p className="effect-epic-hint-text">WASD или стрелки для движения</p>
        <div className="effect-maze-grid">
          {MAZE.map((row, r) =>
            row.map((isWall, c) => {
              const isPlayer = pos[0] === r && pos[1] === c;
              const isEnd = r === 6 && c === 6;
              const isStart = r === 0 && c === 0;
              return (
                <div
                  key={`${r}-${c}`}
                  className={[
                    "effect-maze-cell",
                    isWall ? "effect-maze-cell--wall" : "effect-maze-cell--path",
                    isPlayer ? "effect-maze-cell--player" : "",
                    !isPlayer && isEnd ? "effect-maze-cell--end" : "",
                    !isPlayer && isStart ? "effect-maze-cell--start" : "",
                  ].filter(Boolean).join(" ")}
                />
              );
            })
          )}
        </div>
        <div className="effect-maze-controls">
          <div className="effect-maze-btn-row">
            <div className="effect-maze-btn-spacer" />
            <button className="effect-maze-btn" onClick={() => move(-1, 0)}>▲</button>
            <div className="effect-maze-btn-spacer" />
          </div>
          <div className="effect-maze-btn-row">
            <button className="effect-maze-btn" onClick={() => move(0, -1)}>◄</button>
            <button className="effect-maze-btn" onClick={() => move(1, 0)}>▼</button>
            <button className="effect-maze-btn" onClick={() => move(0, 1)}>►</button>
          </div>
        </div>
      </div>
    </div>
  );
}
