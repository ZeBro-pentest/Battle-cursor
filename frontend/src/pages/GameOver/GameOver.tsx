import { useNavigate, useLocation, Navigate } from "react-router-dom";
import cloudinaryImages from "../../assets/cloudinary-images.json";
import "./GameOver.css";

interface RoundScore {
  user_id: string;
  username: string;
  score: number;
  comment: string;
  image_url: string;
  coins_earned?: number;
}

interface RoundHistoryEntry {
  round_number: number;
  prompt: string;
  scores: RoundScore[];
}

interface FinalScore {
  user_id: string;
  username: string;
  total_score: number;
  total_coins: number;
}

interface GameOverState {
  finalScores: FinalScore[];
  roundHistory: RoundHistoryEntry[];
  myId: string | null;
}

async function downloadImage(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function GameOver() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as GameOverState | null;

  if (!state?.finalScores) {
    return <Navigate to="/main" replace />;
  }

  const { finalScores, roundHistory, myId } = state;

  const sorted = [...finalScores].sort((a, b) => b.total_score - a.total_score);
  const myEntry = sorted.find((s) => s.user_id === myId);
  const myRank = myEntry ? sorted.indexOf(myEntry) + 1 : null;
  const winner = sorted[0] ?? null;
  const winnerId = winner?.user_id ?? null;
  const iAmWinner = myId !== null && myId === winnerId;
  const winnerGetsRating = winner !== null && winner.total_coins >= 100;

  return (
    <div className="gameover-page">
      <header className="gameover-header">
        <img
          src={(cloudinaryImages as Record<string, string>)["logo.png"]}
          alt="Battle Cursor"
          className="gameover-logo"
        />
        <span className="gameover-header-title">ИТОГИ ИГРЫ</span>
        <div className="gameover-header-spacer" />
      </header>

      <div className="gameover-content">
        <h1 className="gameover-title">Игра завершена</h1>

        {myRank !== null && myEntry && (
          <div className="gameover-my-result">
            <span>
              Ваше место:{" "}
              <strong className="gameover-accent">#{myRank}</strong>
            </span>
            <span className="gameover-sep">·</span>
            <span>
              Очки:{" "}
              <strong className="gameover-accent">
                {myEntry.total_score.toFixed(1)}
              </strong>
            </span>
            <span className="gameover-sep">·</span>
            <span className="gameover-coins">+{myEntry.total_coins} ₡</span>
            {iAmWinner && winnerGetsRating && (
              <span className="gameover-rating-badge">+1 ★ Рейтинг</span>
            )}
          </div>
        )}

        <section className="gameover-section">
          <h2 className="gameover-section-title">Итоги</h2>
          <div className="gameover-scores-table">
            {sorted.map((s, i) => (
              <div
                key={s.user_id}
                className={[
                  "gameover-score-row",
                  s.user_id === winnerId ? "gameover-score-row--winner" : "",
                  s.user_id === myId ? "gameover-score-row--me" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className={`gameover-score-rank${s.user_id === winnerId ? " gameover-score-rank--winner" : ""}`}
                >
                  #{i + 1}
                </span>
                <span className="gameover-score-name">
                  {s.user_id === myId && (
                    <span className="gameover-me-tag">[Я]</span>
                  )}
                  {s.username}
                </span>
                <span className="gameover-score-pts">
                  {s.total_score.toFixed(1)} pts
                </span>
                <span className="gameover-score-coins">+{s.total_coins} ₡</span>
                {s.user_id === winnerId && winnerGetsRating && (
                  <span className="gameover-rating-badge gameover-rating-badge--sm">
                    +1 ★
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {roundHistory.length > 0 && (
          <section className="gameover-section">
            <h2 className="gameover-section-title">История раундов</h2>
            {roundHistory.map((entry) => {
              const sortedScores = [...entry.scores].sort(
                (a, b) => b.score - a.score,
              );
              return (
                <div key={entry.round_number} className="gameover-round">
                  <div className="gameover-round-header">
                    <span className="gameover-round-num">
                      Раунд {entry.round_number}
                    </span>
                    {entry.prompt && (
                      <span className="gameover-round-prompt">
                        "{entry.prompt}"
                      </span>
                    )}
                  </div>
                  <div className="gameover-round-cards">
                    {sortedScores.map((s, i) => (
                      <div
                        key={s.user_id}
                        className={`gameover-card${s.user_id === myId ? " gameover-card--me" : ""}`}
                      >
                        <span className="gameover-card-rank">#{i + 1}</span>
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            alt={s.username}
                            className="gameover-card-img"
                          />
                        ) : (
                          <div className="gameover-card-img-placeholder" />
                        )}
                        <span className="gameover-card-username">
                          {s.username}
                        </span>
                        <span className="gameover-card-score">
                          {s.score.toFixed(1)}
                        </span>
                        {s.coins_earned !== undefined && (
                          <span className="gameover-card-coins">
                            +{s.coins_earned} ₡
                          </span>
                        )}
                        {s.comment && (
                          <p className="gameover-card-comment">{s.comment}</p>
                        )}
                        {s.user_id === myId && s.image_url && (
                          <button
                            className="gameover-download-btn"
                            onClick={() =>
                              downloadImage(
                                s.image_url,
                                `battle-cursor-r${entry.round_number}-${new Date().toISOString().slice(0, 10)}.png`,
                              )
                            }
                          >
                            Скачать
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <button
          className="gameover-home-btn"
          onClick={() => navigate("/main")}
        >
          На главную
        </button>
      </div>
    </div>
  );
}
