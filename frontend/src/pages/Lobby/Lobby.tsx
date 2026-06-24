import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { serversAPI, userAPI, WS_BASE_URL } from "../../services/api";
import type { Canvas, Cursor, UserProfile } from "../../types/user";
import { PlayerCard, EmptyPlayerCard } from "../../components/PlayerCard/PlayerCard";
import { Countdown } from "../../components/Countdown/Countdown";
import "./Lobby.css";

interface LobbyPlayer {
  id: string | null;
  username: string;
  cursor: Cursor | null;
  canvas: Canvas | null;
}

export function Lobby() {
  const { room_code } = useParams<{ room_code: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [host, setHost] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [wsError, setWsError] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const gameIdRef = useRef<string | null>(null);

  // Fetch current user profile
  useEffect(() => {
    userAPI.getProfile().then((r) => setProfile(r.data)).catch(() => {});
  }, []);

  // Step 1: join the server, then populate initial player list
  useEffect(() => {
    if (!room_code) return;
    serversAPI.joinServer(room_code)
      .then((r) => {
        const data = r.data;
        setHost(data.host);
        setMaxPlayers(data.max_players);
        setPlayers(
          (data.players as string[]).map((username) => ({
            id: null,
            username,
            cursor: null,
            canvas: null,
          })),
        );
        setJoined(true);
      })
      .catch((err) => {
        const detail =
          err?.response?.data?.detail ?? "Не удалось войти в комнату.";
        setJoinError(detail);
      });
  }, [room_code]);

  // Enrich player with profile data when we get their user_id
  const enrichPlayer = useCallback((userId: string, username: string) => {
    userAPI.getProfileById(userId).then((r) => {
      const p: UserProfile = r.data;
      setPlayers((prev) => {
        const idx = prev.findIndex((pl) => pl.username === username);
        const updated: LobbyPlayer = { id: userId, username, cursor: p.cursor, canvas: p.canvas };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }).catch(() => {});
  }, []);

  // Step 2: connect WebSocket only after successful join
  useEffect(() => {
    if (!room_code || !joined) return;
    const token = localStorage.getItem("access_token") ?? "";
    const url = `${WS_BASE_URL}/ws/game/${room_code}/?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setWsError(false);

    ws.onmessage = (e) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(e.data as string);
      } catch {
        return;
      }

      switch (msg.type) {
        case "player_joined": {
          const userId = msg.user_id as string;
          const username = msg.username as string;
          enrichPlayer(userId, username);
          break;
        }
        case "player_left": {
          const username = msg.username as string;
          setPlayers((prev) => prev.filter((p) => p.username !== username));
          break;
        }
        case "game_start": {
          gameIdRef.current = msg.game_id as string;
          setShowCountdown(true);
          break;
        }
        default:
          break;
      }
    };

    ws.onerror = () => setWsError(true);
    ws.onclose = () => {};

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [room_code, joined, enrichPlayer]);

  // Enrich current user once profile loads
  useEffect(() => {
    if (!profile) return;
    setPlayers((prev) => {
      const idx = prev.findIndex((p) => p.username === profile.username);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = { id: profile.id, username: profile.username, cursor: profile.cursor, canvas: profile.canvas };
      return next;
    });
  }, [profile]);

  const handleStart = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "game_start" }));
    }
  };

  const handleCountdownComplete = () => {
    const gid = gameIdRef.current;
    if (gid) navigate(`/game/${gid}`);
  };

  const isHost = profile?.username === host;
  const emptySlots = Math.max(0, maxPlayers - players.length);

  if (joinError) {
    return (
      <div className="lobby-page">
        <div className="lobby-inner">
          <header className="lobby-header">
            <p className="lobby-eyebrow">// Ошибка</p>
            <p className="lobby-ws-error">{joinError}</p>
            <button className="lobby-start-btn" onClick={() => navigate("/main")}>
              Назад
            </button>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-page">
      {showCountdown && <Countdown onComplete={handleCountdownComplete} />}

      <div className="lobby-inner">
        <header className="lobby-header">
          <p className="lobby-eyebrow">// Комната</p>
          <h1 className="lobby-code">{room_code}</h1>
          <p className="lobby-meta">
            <span>{players.length}</span>
            <span className="lobby-meta-sep">/</span>
            <span>{maxPlayers}</span>
            <span className="lobby-meta-label">игроков</span>
            {host && (
              <>
                <span className="lobby-meta-sep">·</span>
                <span className="lobby-meta-label">хост</span>
                <span>@{host}</span>
              </>
            )}
          </p>
          {wsError && (
            <p className="lobby-ws-error">Ошибка подключения к серверу</p>
          )}
        </header>

        <div className="lobby-grid">
          {players.map((p) => (
            <PlayerCard
              key={p.username}
              username={p.username}
              cursor={p.cursor}
              canvas={p.canvas}
              isHost={p.username === host}
              isCurrentUser={p.username === profile?.username}
            />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <EmptyPlayerCard key={`empty-${i}`} />
          ))}
        </div>

        <footer className="lobby-footer">
          {isHost ? (
            <button
              className="lobby-start-btn"
              onClick={handleStart}
              disabled={players.length < 2}
            >
              {players.length < 2 ? "Ожидание игроков..." : "Начать игру"}
            </button>
          ) : (
            <p className="lobby-waiting">Ожидаем хоста...</p>
          )}
        </footer>
      </div>
    </div>
  );
}
