import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import { serversAPI, userAPI, gameAPI, WS_BASE_URL } from "../../services/api";
import type { Cursor, UserProfile } from "../../types/user";
import { DEBUFF_MAP, DEBUFF_RARITY_COLOR } from "../../constants/debuffs";
import { floodFill } from "../../utils/floodFill";
import { DebuffOverlay } from "../../components/debuffs/DebuffOverlay";
import { getCanvasStyle } from "../../components/debuffs/effects/BlurEffect";
import "./Game.css";

// ─── Constants ───────────────────────────────────────────────────────────────


const PALETTE = [
  "#000000",
  "#808080",
  "#8b4513",
  "#ffffff",
  "#ff69b4",
  "#9b59b6",
  "#006400",
  "#8b0000",
  "#ff0000",
  "#ff8c00",
  "#ffff00",
  "#00cc00",
  "#87ceeb",
  "#0000ff",
  "#8b00ff",
  "#00ffff",
];

const MAX_HISTORY = 20;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── Types ────────────────────────────────────────────────────────────────────

interface GamePlayer {
  user_id: string | null;
  username: string;
  coins: number;
  rating: number;
  cursor: Cursor | null;
  canvas: { image_url: string | null } | null;
  online: boolean;
}

interface RoundState {
  round_id: string;
  round_number: number;
  prompt: string;
  duration: number;
}

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

type GamePhase = "waiting" | "playing" | "round_results";

// ─── Main component ───────────────────────────────────────────────────────────

export function Game() {
  const { room_code } = useParams<{ room_code: string }>();
  const navigate = useNavigate();

  // Profile & players
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);

  // Game state
  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [round, setRound] = useState<RoundState | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalScore, setTotalScore] = useState(0);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});

  // Debuff selection
  const [selectedTargetIdx, setSelectedTargetIdx] = useState(0);
  const [selectedDebuffIdx, setSelectedDebuffIdx] = useState(0);
  const [usedDebuffs, setUsedDebuffs] = useState<Set<string>>(new Set());
  const [activeDebuffs, setActiveDebuffs] = useState<Record<string, string>>(
    {},
  );
  const [activeEffects, setActiveEffects] = useState<Set<string>>(new Set());
  const [activeTargetDebuffs, setActiveTargetDebuffs] = useState<Set<string>>(new Set());

  // Canvas protections
  const [myProtections, setMyProtections] = useState<string[]>([]);
  const [usedProtections, setUsedProtections] = useState<Set<string>>(new Set());

  // Overlays
  const [timerOverlay, setTimerOverlay] = useState<number | null>(null);
  const [roundStartOverlay, setRoundStartOverlay] = useState<{
    round_number: number;
    prompt: string;
  } | null>(null);
  const [roundResults, setRoundResults] = useState<RoundScore[]>([]);
  const [, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const roundHistoryRef = useRef<RoundHistoryEntry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [roundResultsTimer, setRoundResultsTimer] = useState(10);

  // Canvas drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorImgRef = useRef<HTMLImageElement>(null);
  const isDrawing = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const [color, setColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isFloodFill, setIsFloodFill] = useState(false);

  // Other players' cursors (canvas-relative coords, 0-1 normalized)
  const [_otherCursors, setOtherCursors] = useState<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  // Refs for WS handlers (avoid stale closures)
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundEndSentRef = useRef(false);
  const roundRef = useRef<RoundState | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const playersRef = useRef<GamePlayer[]>([]);
  const timerOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeEffectsRef = useRef<Set<string>>(new Set());
  const lastDrawPosRef = useRef<{ x: number; y: number } | null>(null);
  const smoothPosRef = useRef({ x: 0, y: 0 });
  const timeLeftRef = useRef(60);
  const lastApplyTimeRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    roundRef.current = round;
  }, [round]);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    activeEffectsRef.current = activeEffects;
  }, [activeEffects]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // ── Load profile ──────────────────────────────────────────────────────────

  useEffect(() => {
    userAPI
      .getProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {});
  }, []);

  // ── Load server player list ───────────────────────────────────────────────

  useEffect(() => {
    if (!room_code) return;
    serversAPI
      .getServer(room_code)
      .then((r) => {
        const data = r.data;
        const playersData = (data.players ?? []) as {
          id: string;
          username: string;
        }[];
        Promise.all(
          playersData.map((p) =>
            userAPI.getProfileById(p.id).then((res) => res.data as UserProfile),
          ),
        )
          .then((profiles) => {
            setPlayers(
              profiles.map((up) => ({
                user_id: up.id,
                username: up.username,
                coins: up.coins,
                rating: up.rating,
                cursor: up.cursor,
                canvas: up.canvas,
                online: true,
              })),
            );
            setPlayersLoaded(true);
          })
          .catch(() => {
            setPlayers(
              playersData.map((p) => ({
                user_id: p.id,
                username: p.username,
                coins: 0,
                rating: 0,
                cursor: null,
                canvas: null,
                online: true,
              })),
            );
            setPlayersLoaded(true);
          });
      })
      .catch((err) => {
        if (err.response?.status === 404) navigate("/main");
      });
  }, [room_code]);

  // ── Enrich current user once profile loads ────────────────────────────────

  useEffect(() => {
    if (!profile) return;
    setPlayers((prev) =>
      prev.map((p) =>
        p.user_id === profile.id || p.username === profile.username
          ? {
              ...p,
              user_id: profile.id,
              coins: profile.coins,
              rating: profile.rating,
              cursor: profile.cursor,
              canvas: profile.canvas,
            }
          : p,
      ),
    );
    setMyProtections(profile.canvas?.protections ?? []);
  }, [profile]);

  // ── Fetch current round on mount (handles missed round_started WS event) ──

  useEffect(() => {
    if (!room_code) return;
    gameAPI
      .getGame(room_code)
      .then((r) => {
        const cr = r.data?.current_round;
        if (!cr || cr.is_finished) return;
        const startedAt = cr.started_at
          ? new Date(cr.started_at).getTime()
          : null;
        const elapsed = startedAt
          ? Math.floor((Date.now() - startedAt) / 1000)
          : 0;
        const remaining = Math.max(1, 60 - elapsed);
        const newRound: RoundState = {
          round_id: cr.id,
          round_number: cr.number,
          prompt: cr.prompt,
          duration: remaining,
        };
        setRound(newRound);
        roundRef.current = newRound;
        setTimeLeft(remaining);
        setPhase("playing");
        roundEndSentRef.current = false;
      })
      .catch((err) => {
        if (err.response?.status === 404) navigate("/main");
      });
  }, [room_code]);

  // ── Timer overlay helper ──────────────────────────────────────────────────

  const showTimerOverlay = useCallback((value: number, ms = 800) => {
    if (timerOverlayTimeoutRef.current)
      clearTimeout(timerOverlayTimeoutRef.current);
    setTimerOverlay(value);
    timerOverlayTimeoutRef.current = setTimeout(
      () => setTimerOverlay(null),
      ms,
    );
  }, []);

  // ── Effect helpers ────────────────────────────────────────────────────────

  const applyEffect = useCallback((debuffId: string, duration: number | null) => {
    setActiveEffects((prev) => new Set([...prev, debuffId]));
    if (duration) {
      setTimeout(() => {
        setActiveEffects((prev) => {
          const next = new Set(prev);
          next.delete(debuffId);
          return next;
        });
      }, duration * 1000);
    }
  }, []);

  const sendWS = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[ws] Not ready, message dropped:", data);
    }
  }, []);

  const removeEffect = useCallback((debuffId: string) => {
    setActiveEffects((prev) => {
      const next = new Set(prev);
      next.delete(debuffId);
      return next;
    });
    setActiveTargetDebuffs((prev) => {
      const next = new Set(prev);
      const myKey = `${profileRef.current?.id}_${debuffId}`;
      next.delete(myKey);
      return next;
    });
    sendWS({
      type: "debuff_solved",
      debuff_id: debuffId,
      user_id: profileRef.current?.id,
    });
  }, [sendWS]);

  // ── WebSocket ─────────────────────────────────────────────────────────────

  const token = localStorage.getItem("access_token") ?? "";

  useEffect(() => {
    if (!token || !room_code || !playersLoaded) return;

    let ws: WebSocket | null = null;
    let unmounted = false;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE_URL}/ws/game/${room_code}/?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) {
          ws?.close();
          return;
        }
      };

      ws.onmessage = (e) => {
        if (unmounted) return;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(e.data as string);
        } catch {
          return;
        }

        switch (msg.type) {
          case "round_started": {
            const { round_id, round_number, prompt, duration } = msg as {
              type: string;
              round_id: string;
              round_number: number;
              prompt: string;
              duration: number;
            };
            const newRound = { round_id, round_number, prompt, duration };
            setRound(newRound);
            roundRef.current = newRound;
            setTimeLeft(duration);
            setPhase("playing");
            setActiveEffects(new Set());
            setUsedDebuffs(new Set());
            setUsedProtections(new Set());
            setActiveDebuffs({});
            setActiveTargetDebuffs(new Set());
            roundEndSentRef.current = false;
            setOtherCursors(new Map());
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
            }
            historyRef.current = [];
            setRoundStartOverlay({ round_number, prompt });
            setTimeout(() => setRoundStartOverlay(null), 1800);
            break;
          }

          case "round_results": {
            const scores = (msg.scores as RoundScore[]) ?? [];
            const roundNum = msg.round_number as number;
            setRoundResults(scores);
            const me = profileRef.current;
            if (me) {
              const myScore = scores.find((s) => s.user_id === me.id);
              if (myScore) setTotalScore((prev) => prev + myScore.score);
            }
            setPlayerScores((prev) => {
              const next = { ...prev };
              scores.forEach((s) => {
                next[s.user_id] = (next[s.user_id] ?? 0) + s.score;
              });
              return next;
            });
            if (!roundHistoryRef.current.some((r) => r.round_number === roundNum)) {
              roundHistoryRef.current = [
                ...roundHistoryRef.current,
                { round_number: roundNum, prompt: roundRef.current?.prompt ?? "", scores },
              ];
              setRoundHistory(roundHistoryRef.current);
            }
            setPhase("round_results");
            setRoundResultsTimer(10);
            break;
          }

          case "game_over": {
            navigate("/game-over", {
              state: {
                finalScores: (msg.final_scores as FinalScore[]) ?? [],
                roundHistory: roundHistoryRef.current,
                myId: profileRef.current?.id ?? null,
              },
            });
            break;
          }

          case "debuff_received": {
            const { debuff_id, duration, from_user_id, target_id, round_id } = msg as {
              type: string;
              debuff_id: string;
              duration: number | null;
              from_user_id: string;
              target_id: string;
              round_id?: string;
            };

            if (round_id && roundRef.current && roundRef.current.round_id !== round_id) {
              console.warn("[debuff] Ignoring stale debuff from old round:", round_id);
              break;
            }

            const from = playersRef.current.find(
              (p) => p.user_id === from_user_id,
            );
            const debuffName = DEBUFF_MAP[debuff_id]?.name ?? debuff_id;

            if (target_id === profileRef.current?.id) {
              setNotification(
                `${from?.username ?? "???"} применил ${debuffName} на тебя!`,
              );
              if (debuff_id === "palette") {
                setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
                setIsEraser(false);
                setIsFloodFill(false);
              }
              applyEffect(debuff_id, duration);
            } else {
              const target = playersRef.current.find(
                (p) => p.user_id === target_id,
              );
              setNotification(
                `${from?.username ?? "???"} → ${target?.username ?? "???"}: ${debuffName}`,
              );
            }
            setTimeout(() => setNotification(null), 3000);

            const LEGENDARY_DEBUFFS = new Set([
              "questions", "exam", "weighting", "weapons", "rickroll",
              "disco", "transparency", "brightness", "roulette", "dvd",
            ]);
            setActiveDebuffs((prev) => ({ ...prev, [target_id]: debuff_id }));
            if (LEGENDARY_DEBUFFS.has(debuff_id)) {
              setTimeout(() => {
                setActiveDebuffs((prev) => {
                  if (prev[target_id] === debuff_id) {
                    const next = { ...prev };
                    delete next[target_id];
                    return next;
                  }
                  return prev;
                });
              }, 5000);
            } else if (duration) {
              setTimeout(() => {
                setActiveDebuffs((prev) => {
                  const next = { ...prev };
                  delete next[target_id];
                  return next;
                });
              }, duration * 1000);
            }
            const atdKey = `${target_id}_${debuff_id}`;
            setActiveTargetDebuffs((prev) => new Set([...prev, atdKey]));
            if (LEGENDARY_DEBUFFS.has(debuff_id)) {
              setTimeout(() => {
                setActiveTargetDebuffs((prev) => {
                  const next = new Set(prev);
                  next.delete(atdKey);
                  return next;
                });
              }, 5000);
            } else if (duration && duration > 0) {
              setTimeout(() => {
                setActiveTargetDebuffs((prev) => {
                  const next = new Set(prev);
                  next.delete(atdKey);
                  return next;
                });
              }, duration * 1000);
            }
            break;
          }

          case "debuff_protected": {
            const { detail } = msg as {
              type: string;
              detail: string;
              debuff_id: string;
              target_id: string;
            };
            setNotification(`🛡️ ${detail}`);
            setTimeout(() => setNotification(null), 3000);
            break;
          }

          case "debuff_blocked": {
            const { target_id, debuff_id } = msg as {
              type: string;
              target_id: string;
              debuff_id: string;
            };
            if (target_id === profileRef.current?.id) {
              setUsedProtections((prev) => new Set([...prev, debuff_id]));
            }
            const blockedTarget = playersRef.current.find(
              (p) => p.user_id === target_id,
            );
            const blockedName = DEBUFF_MAP[debuff_id]?.name ?? debuff_id;
            setNotification(
              `🛡️ ${blockedTarget?.username ?? "???"} заблокировал дебафф ${blockedName}!`,
            );
            setTimeout(() => setNotification(null), 3000);
            break;
          }

          case "debuff_reflected": {
            const { detail: reflectDetail } = msg as { type: string; detail: string };
            setNotification(`🪞 ${reflectDetail}`);
            setTimeout(() => setNotification(null), 3000);
            break;
          }

          case "debuff_solved": {
            const { debuff_id, user_id } = msg as {
              type: string;
              debuff_id: string;
              user_id: string;
            };
            setActiveTargetDebuffs((prev) => {
              const next = new Set(prev);
              [...next].forEach((key) => {
                if (key.startsWith(`${user_id}_`) && key.endsWith(`_${debuff_id}`)) {
                  next.delete(key);
                }
              });
              return next;
            });
            setActiveDebuffs((prev) => {
              if (prev[user_id] === debuff_id) {
                const next = { ...prev };
                delete next[user_id];
                return next;
              }
              return prev;
            });
            break;
          }

          case "cursor_update": {
            const { user_id, x, y } = msg as {
              type: string;
              user_id: string;
              x: number;
              y: number;
            };
            if (user_id !== profileRef.current?.id) {
              setOtherCursors((prev) => {
                const next = new Map(prev);
                next.set(user_id, { x, y });
                return next;
              });
            }
            break;
          }

          case "player_joined": {
            const { user_id, username } = msg as {
              type: string;
              user_id: string;
              username: string;
            };
            setPlayers((prev) => {
              const existing = prev.find((p) => p.username === username);
              if (existing) {
                return prev.map((p) =>
                  p.username === username ? { ...p, user_id, online: true } : p,
                );
              }
              return [
                ...prev,
                {
                  user_id,
                  username,
                  coins: 0,
                  rating: 0,
                  cursor: null,
                  canvas: null,
                  online: true,
                },
              ];
            });
            userAPI
              .getProfileById(user_id)
              .then((r) => {
                if (unmounted) return;
                const up: UserProfile = r.data;
                setPlayers((prev) =>
                  prev.map((p) =>
                    p.user_id === user_id
                      ? {
                          ...p,
                          coins: up.coins,
                          rating: up.rating,
                          cursor: up.cursor,
                          canvas: up.canvas,
                        }
                      : p,
                  ),
                );
              })
              .catch(() => {});
            break;
          }

          case "player_left": {
            const { user_id, kicked } = msg as { type: string; user_id: string; kicked?: boolean };
            if (user_id === profileRef.current?.id && kicked) {
              navigate("/main", {
                state: { error: "Вы были исключены из игры за отсутствие." },
              });
              return;
            }
            setPlayers((prev) =>
              prev.map((p) =>
                p.user_id === user_id ? { ...p, online: false } : p,
              ),
            );
            if (kicked) {
              const kickedPlayer = playersRef.current.find((p) => p.user_id === user_id);
              setNotification(`${kickedPlayer?.username ?? "Игрок"} исключён за отсутствие`);
              setTimeout(() => setNotification(null), 3000);
            }
            break;
          }

          case "game_state_sync": {
            const { round_id, round_number, prompt, time_left, used_debuffs, player_scores } = msg as {
              type: string;
              game_id: string;
              round_id: string;
              round_number: number;
              prompt: string;
              time_left: number;
              total_rounds: number;
              used_debuffs?: string[];
              player_scores?: Record<string, number>;
            };
            const restoredRound = { round_id, round_number, prompt, duration: time_left };
            setRound(restoredRound);
            roundRef.current = restoredRound;
            setTimeLeft(time_left);
            setPhase("playing");
            roundEndSentRef.current = false;
            if (used_debuffs) {
              setUsedDebuffs(new Set(used_debuffs));
            }
            if (player_scores) {
              setPlayerScores(player_scores);
            }
            if (msg.round_history) {
              roundHistoryRef.current = msg.round_history as RoundHistoryEntry[];
              setRoundHistory(roundHistoryRef.current);
            }
            break;
          }
        }
      };

      ws.onerror = () => {};
      ws.onclose = () => {};

      pingRef.current = setInterval(() => {
        sendWS({ type: "ping", timestamp: Date.now() });
      }, 10000);
    };

    connect();

    return () => {
      unmounted = true;
      ws?.close();
      wsRef.current = null;
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [token, room_code, playersLoaded, showTimerOverlay, sendWS]);

  // ── Countdown timer ───────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Timer overlay at key moments
  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft === 30 || timeLeft === 15 || (timeLeft <= 3 && timeLeft > 0)) {
      showTimerOverlay(timeLeft, 800);
    }
  }, [timeLeft, phase, showTimerOverlay]);

  // Send round_end when timer hits 0
  useEffect(() => {
    if (timeLeft !== 0 || phase !== "playing") return;
    if (roundEndSentRef.current) return;
    roundEndSentRef.current = true;

    const r = roundRef.current;
    if (r) {
      const canvas = canvasRef.current;
      const image_base64 = canvas
        ? canvas.toDataURL("image/png").split(",")[1]
        : "";
      sendWS({
        type: "round_end",
        round_id: r.round_id,
        image_base64,
        image_url: "",
      });
    }
    setPhase("waiting");
  }, [timeLeft, phase, sendWS]);

  // ── Round results countdown ───────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "round_results") return;
    const interval = setInterval(() => {
      setRoundResultsTimer((prev) => {
        if (prev <= 1) {
          setPhase("waiting");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  const otherPlayers = players.filter((p) => p.user_id !== profile?.id);
  const myDebuffs = profile?.cursor?.debuffs ?? [];

  const handleApplyDebuff = useCallback(() => {
    const now = Date.now();
    if (now - lastApplyTimeRef.current < 500) return;
    lastApplyTimeRef.current = now;

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn("[debuff] WS not ready, ignoring apply");
      return;
    }

    const prof = profileRef.current;
    const allPlayers = playersRef.current;
    if (!prof) return;
    const others = allPlayers.filter((p) => p.user_id !== prof.id);
    if (others.length === 0) return;
    const target = others[selectedTargetIdx % others.length];
    if (!target?.user_id) return;
    const debuffs = prof.cursor?.debuffs ?? [];
    if (debuffs.length === 0) return;
    const debuffId = debuffs[selectedDebuffIdx % Math.max(debuffs.length, 1)];
    if (usedDebuffs.has(debuffId)) return;

    if (timeLeftRef.current <= 5) {
      setNotification("Нельзя применять дебаффы в последние 5 секунд раунда!");
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    const hasActiveDebuff = [...activeTargetDebuffs].some((key) =>
      key.startsWith(`${target.user_id}_`),
    );
    if (hasActiveDebuff) {
      setNotification("У игрока уже активен дебафф! Подожди.");
      setTimeout(() => setNotification(null), 2000);
      return;
    }

    sendWS({
      type: "debuff_apply",
      debuff_id: debuffId,
      target_id: target.user_id,
    });
    setUsedDebuffs((prev) => new Set([...prev, debuffId]));
  }, [selectedTargetIdx, selectedDebuffIdx, usedDebuffs, activeTargetDebuffs, sendWS]);

  useEffect(() => {
    const oLen = otherPlayers.length;
    const dLen = myDebuffs.length;

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx || historyRef.current.length === 0) return;
        ctx.putImageData(historyRef.current.pop()!, 0, 0);
        return;
      }
      if (e.code === "KeyA" && oLen > 0) {
        setSelectedTargetIdx((prev) => (prev - 1 + oLen) % oLen);
        return;
      }
      if (e.code === "KeyD" && oLen > 0) {
        setSelectedTargetIdx((prev) => (prev + 1) % oLen);
        return;
      }
      if (e.code === "KeyW" && dLen > 0) {
        setSelectedDebuffIdx((prev) => (prev - 1 + dLen) % dLen);
        return;
      }
      if (e.code === "KeyS" && dLen > 0) {
        setSelectedDebuffIdx((prev) => (prev + 1) % dLen);
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        handleApplyDebuff();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [otherPlayers.length, myDebuffs.length, handleApplyDebuff]);

  // ── Canvas drawing ────────────────────────────────────────────────────────

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (historyRef.current.length >= MAX_HISTORY) historyRef.current.shift();
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (phase !== "playing") return;
    if (activeEffectsRef.current.has("captcha") || activeEffectsRef.current.has("puzzle")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    saveHistory();
    const raw = getPos(e);
    const effects = activeEffectsRef.current;
    const last = lastDrawPosRef.current;
    let x = raw.x;
    let y = raw.y;
    if (effects.has("weighting")) {
      x = smoothPosRef.current.x;
      y = smoothPosRef.current.y;
    } else if (effects.has("weight")) {
      x = smoothPosRef.current.x;
      y = smoothPosRef.current.y;
    } else if (effects.has("chill") && last) {
      x = last.x + (x - last.x) * 0.3;
      y = last.y + (y - last.y) * 0.3;
    } else if (effects.has("quickly") && last) {
      x = last.x + (x - last.x) * 1.5;
      y = last.y + (y - last.y) * 1.5;
    }
    lastDrawPosRef.current = { x, y };
    if (isFloodFill) {
      floodFill(ctx, Math.floor(x), Math.floor(y), color);
      return;
    }
    isDrawing.current = true;
    const size = isEraser ? brushSize * 3 : brushSize;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? "rgba(255,255,255,1)" : color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const sendCursorMove = useCallback((x: number, y: number) => {
    sendWS({ type: "cursor_move", x, y });
  }, [sendWS]);

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cursorImgRef.current) {
      cursorImgRef.current.style.left = `${e.clientX}px`;
      cursorImgRef.current.style.top = `${e.clientY}px`;
    }
    const raw = getPos(e);
    const effects = activeEffectsRef.current;
    const last = lastDrawPosRef.current;
    let x = raw.x;
    let y = raw.y;
    if (effects.has("weighting")) {
      smoothPosRef.current = { x: lerp(smoothPosRef.current.x, raw.x, 0.1), y: lerp(smoothPosRef.current.y, raw.y, 0.1) };
      x = smoothPosRef.current.x;
      y = smoothPosRef.current.y;
    } else if (effects.has("weight")) {
      smoothPosRef.current = { x: lerp(smoothPosRef.current.x, raw.x, 0.15), y: lerp(smoothPosRef.current.y, raw.y, 0.15) };
      x = smoothPosRef.current.x;
      y = smoothPosRef.current.y;
    } else if (effects.has("chill") && last) {
      x = last.x + (x - last.x) * 0.3;
      y = last.y + (y - last.y) * 0.3;
    } else if (effects.has("quickly") && last) {
      x = last.x + (x - last.x) * 1.5;
      y = last.y + (y - last.y) * 1.5;
    }
    lastDrawPosRef.current = { x, y };
    sendCursorMove(Math.round(x), Math.round(y));

    if (effects.has("brightness")) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const relY = (e.clientY - rect.top) / rect.height;
        document.body.style.filter = `brightness(${Math.max(0.1, 1 - relY)})`;
      }
    }

    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const size = isEraser ? brushSize * 3 : brushSize;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? "rgba(255,255,255,1)" : color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const ctx = canvasRef.current?.getContext("2d", {
      willReadFrequently: true,
    });
    if (ctx) ctx.globalCompositeOperation = "source-over";
  };

  const onCanvasEnter = () => {
    if (cursorImgRef.current) cursorImgRef.current.style.visibility = "visible";
  };

  const onCanvasLeave = () => {
    if (cursorImgRef.current) cursorImgRef.current.style.visibility = "hidden";
    onMouseUp();
  };

  const handleClear = () => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    saveHistory();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Initialize canvas white on profile load
  useEffect(() => {
    if (!profile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [profile]);

  // ── Palette ───────────────────────────────────────────────────────────────

  const hasPalette = activeEffects.has("palette");
  useEffect(() => {
    if (!hasPalette) return;
    const interval = setInterval(() => {
      setColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [hasPalette]);

  // ── Disco ─────────────────────────────────────────────────────────────────

  const hasDisco = activeEffects.has("disco");
  useEffect(() => {
    if (!hasDisco) return;
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff", "#ff9f43", "#48dbfb", "#ff6b81"];
    let i = 0;
    const interval = setInterval(() => {
      if (canvasRef.current) canvasRef.current.style.backgroundColor = colors[i % colors.length];
      i++;
    }, 500);
    return () => {
      clearInterval(interval);
      if (canvasRef.current) canvasRef.current.style.backgroundColor = "#ffffff";
    };
  }, [hasDisco]);

  // ── Transparency ──────────────────────────────────────────────────────────

  const hasTransparency = activeEffects.has("transparency");
  useEffect(() => {
    if (!hasTransparency) return;
    const interval = setInterval(() => {
      if (canvasRef.current)
        canvasRef.current.style.opacity = String(0.3 + Math.random() * 0.7);
    }, 800);
    return () => {
      clearInterval(interval);
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    };
  }, [hasTransparency]);

  // ── Brightness cleanup ────────────────────────────────────────────────────

  const hasBrightness = activeEffects.has("brightness");
  useEffect(() => {
    if (!hasBrightness) document.body.style.filter = "";
    return () => { document.body.style.filter = ""; };
  }, [hasBrightness]);

  // ─── Render ───────────────────────────────────────────────────────────────


  const sortedResults = [...roundResults].sort((a, b) => b.score - a.score);
  const myRankInRound = profile
    ? sortedResults.findIndex((s) => s.user_id === profile.id) + 1
    : null;

  const totalRounds = players.length;

  return (
    <div className="game-page">
      {/* ── Game header ── */}
      <header className="game-header">
        <div className="game-header-left">
          <span className="game-header-logo">Battle</span>
          <span className="game-header-title">cursor</span>
        </div>
        <div className="game-header-center">
          <span
            className={`game-header-timer${timeLeft <= 10 && phase === "playing" ? " game-header-timer--urgent" : ""}`}
          >
            {phase === "playing" ? timeLeft : "—"}
          </span>
        </div>
        <div className="game-header-right">
          {round ? `Раунд ${round.round_number} / ${totalRounds}` : ""}
        </div>
      </header>

      {/* Timer overlay — big number at key moments */}
      {timerOverlay !== null && (
        <div className="game-timer-overlay">{timerOverlay}</div>
      )}

      {/* Round start overlay — fade in/out animation */}
      {roundStartOverlay && (
        <div className="game-round-start-overlay">
          <div className="game-round-start-inner">
            <span className="game-round-start-label">РАУНД</span>
            <span className="game-round-start-number">
              {roundStartOverlay.round_number}
            </span>
            <span className="game-round-start-prompt">
              Нарисуйте: {roundStartOverlay.prompt}
            </span>
          </div>
        </div>
      )}

      {/* Round results overlay */}
      {phase === "round_results" && (
        <RoundResultsOverlay
          scores={roundResults}
          myId={profile?.id ?? null}
          countdown={roundResultsTimer}
        />
      )}

      {/* Debuff notification */}
      {notification && <div className="game-notification">{notification}</div>}

      {/* ── Top: player cards ── */}
      <div className="game-players">
        {(() => {
          const sorted = [...players]
            .filter((p) => p.user_id && playerScores[p.user_id] !== undefined)
            .sort((a, b) => (playerScores[b.user_id!] ?? 0) - (playerScores[a.user_id!] ?? 0));
          const rankMap: Record<string, number> = {};
          sorted.forEach((p, i) => { if (p.user_id) rankMap[p.user_id] = i + 1; });
          return players.map((player) => {
          const isMe = player.user_id === profile?.id;
          const otherIdx = otherPlayers.indexOf(player);
          const isSelected =
            !isMe &&
            otherIdx >= 0 &&
            otherIdx === selectedTargetIdx % Math.max(otherPlayers.length, 1);
          const debuffId = player.user_id
            ? activeDebuffs[player.user_id]
            : undefined;

          return (
            <div
              key={player.username}
              className={[
                "game-player-card",
                isSelected ? "game-player-card--selected" : "",
                isMe ? "game-player-card--me" : "",
                !player.online ? "game-player-card--offline" : "",
              ]
                .join(" ")
                .trim()}
              onClick={() => {
                if (!isMe && otherIdx >= 0) setSelectedTargetIdx(otherIdx);
              }}
            >
              <div className="game-player-card-content">
              <div
                className={`game-player-online-dot${player.online ? " game-player-online-dot--on" : ""}`}
              />

              {debuffId ? (
                <div
                  className="game-player-debuff-active"
                  style={{
                    color:
                      DEBUFF_RARITY_COLOR[
                        DEBUFF_MAP[debuffId]?.rarity ?? "COMMON"
                      ],
                  }}
                >
                  {DEBUFF_MAP[debuffId]?.name ?? debuffId}
                </div>
              ) : !isMe && activeEffects.has("anonim") ? (
                <div className="game-player-cursor-placeholder" />
              ) : player.cursor?.image_url ? (
                <img
                  src={player.cursor.image_url}
                  alt=""
                  className="game-player-cursor-img"
                />
              ) : (
                <div className="game-player-cursor-placeholder" />
              )}

              <div className="game-player-username">
                {!isMe && activeEffects.has("anonim")
                  ? "???"
                  : player.username}
                {isMe ? " (я)" : ""}
              </div>
              <div className="game-player-stats">
                {player.user_id && playerScores[player.user_id] !== undefined ? (
                  <>
                    <span className="game-player-score">
                      {playerScores[player.user_id].toFixed(1)}
                    </span>
                    {rankMap[player.user_id] && (
                      <span className="game-player-rank">
                        #{rankMap[player.user_id]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="game-player-waiting">—</span>
                )}
              </div>
              </div>
            </div>
          );
        });
        })()}
      </div>

      {/* ── Main area ── */}
      <div className="game-main">
        {/* Left: debuffs */}
        <aside className="game-debuffs">
          <p className="game-section-label">// Дебаффы</p>
          {myDebuffs.length === 0 && (
            <p className="game-debuffs-empty">Нет дебаффов</p>
          )}
          {(() => {
            const currentTarget =
              otherPlayers[selectedTargetIdx % Math.max(otherPlayers.length, 1)];
            const currentTargetId = currentTarget?.user_id;
            const targetHasActiveDebuff = currentTargetId
              ? [...activeTargetDebuffs].some((key) =>
                  key.startsWith(`${currentTargetId}_`),
                )
              : false;
            return myDebuffs.map((id, idx) => {
              const info = DEBUFF_MAP[id];
              const isSelected =
                idx === selectedDebuffIdx % Math.max(myDebuffs.length, 1);
              const isUsed = usedDebuffs.has(id);
              return (
                <div
                  key={id}
                  className={[
                    "game-debuff-item",
                    isSelected ? "game-debuff-item--selected" : "",
                    isUsed ? "game-debuff-item--used" : "",
                  ]
                    .join(" ")
                    .trim()}
                  onClick={() => setSelectedDebuffIdx(idx)}
                >
                  <span
                    className="game-debuff-name"
                    style={{
                      color: isUsed
                        ? "#444"
                        : DEBUFF_RARITY_COLOR[info?.rarity ?? "COMMON"],
                    }}
                  >
                    {info?.name ?? id}
                    {targetHasActiveDebuff && (
                      <span className="game-debuff-locked" title="У цели уже активен дебафф">
                        {" "}🔒
                      </span>
                    )}
                  </span>
                  <span
                    className="game-debuff-rarity"
                    style={{
                      color: isUsed
                        ? "#444"
                        : DEBUFF_RARITY_COLOR[info?.rarity ?? "COMMON"],
                    }}
                  >
                    {info?.rarity ?? ""}
                  </span>
                </div>
              );
            });
          })()}
          {myDebuffs.length > 0 && (
            <button
              className="game-debuff-apply-btn"
              onClick={handleApplyDebuff}
              disabled={phase !== "playing"}
            >
              Применить
              <span className="game-key-hint">[Space]</span>
            </button>
          )}
          <div className="game-key-hints">
            <span>A/D — цель</span>
            <span>W/S — дебафф</span>
          </div>

          {myProtections.length > 0 && (
            <div className="game-protections">
              <p className="game-section-label">// Защиты</p>
              {myProtections.map((id) => {
                const isUsed = usedProtections.has(id);
                return (
                  <div
                    key={id}
                    className={`game-protection-item${isUsed ? " game-protection-item--used" : ""}`}
                  >
                    <span>🛡️ {DEBUFF_MAP[id]?.name ?? id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Center: canvas */}
        <div className="game-canvas-area">
          <div className="game-canvas-top">
            <div className="game-canvas-prompt">
              {round ? `Нарисуйте: ${round.prompt}` : "Ожидание раунда..."}
            </div>
            <div className="game-canvas-score">
              {myRankInRound !== null && myRankInRound > 0
                ? `Место: ${myRankInRound} | Очков: ${totalScore.toFixed(1)}`
                : " "}
            </div>
          </div>
          <div
            className={`game-canvas-wrapper${profile?.canvas?.image_url ? "" : " game-canvas-wrapper--default"}`}
          >
            {profile?.canvas?.image_url && (
              <img
                src={profile.canvas.image_url}
                alt=""
                className="game-canvas-frame"
              />
            )}
            <canvas
              ref={canvasRef}
              className="game-drawing-canvas"
              width={570}
              height={560}
              style={getCanvasStyle(activeEffects)}
              onMouseDown={onMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onMouseUp}
              onMouseEnter={onCanvasEnter}
              onMouseLeave={onCanvasLeave}
            />
            <DebuffOverlay
              activeEffects={activeEffects}
              onEffectComplete={removeEffect}
              canvasRef={canvasRef}
            />
            {phase === "waiting" && roundEndSentRef.current && (
              <div className="game-waiting-overlay">
                <div className="game-waiting-spinner" />
                <p className="game-waiting-text">Ожидание результатов...</p>
              </div>
            )}
          </div>
          {/* Custom cursor */}
          {profile?.cursor?.image_url && (
            <img
              ref={cursorImgRef}
              src={profile.cursor.image_url}
              alt=""
              className="game-custom-cursor"
            />
          )}
        </div>

        {/* Right: tools */}
        <aside className="game-tools">
          <p className="game-section-label">// Инструменты</p>
          <div className="game-palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`game-swatch${c === color && !isEraser && !isFloodFill ? " game-swatch--active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                  setIsFloodFill(false);
                }}
                title={c}
              />
            ))}
          </div>
          <div
            className="game-color-preview"
            style={{ background: color }}
            onClick={() => setShowColorPicker((v) => !v)}
          />
          {showColorPicker && (
            <div className="game-color-picker-popup">
              <HexColorPicker
                color={color}
                onChange={(c) => {
                  setColor(c);
                  setIsEraser(false);
                  setIsFloodFill(false);
                }}
              />
            </div>
          )}
          <button
            className={`game-eraser-btn${isEraser ? " game-eraser-btn--active" : ""}`}
            onClick={() => { setIsEraser((v) => !v); setIsFloodFill(false); }}
          >
            ◈ Ластик
          </button>
          <button
            className={`game-eraser-btn${isFloodFill ? " game-eraser-btn--active" : ""}`}
            onClick={() => { setIsFloodFill((v) => !v); setIsEraser(false); }}
          >
            ◈ Заливка
          </button>
          <div className="game-brush-row">
            <div className="game-brush-header">
              <span>Кисть</span>
              <span>{brushSize}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="game-brush-range"
            />
          </div>
          <button
            className="game-clear-btn"
            onClick={handleClear}
            disabled={phase !== "playing"}
          >
            Очистить
          </button>
          <p className="game-undo-hint">Ctrl+Z — отменить</p>
        </aside>
      </div>
    </div>
  );
}

// ─── Round Results Overlay ────────────────────────────────────────────────────

function RoundResultsOverlay({
  scores,
  myId,
  countdown,
}: {
  scores: RoundScore[];
  myId: string | null;
  countdown: number;
}) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  return (
    <div className="game-overlay">
      <div className="game-overlay-inner">
        <div className="game-overlay-header">
          <h2>Результаты раунда</h2>
          <span className="game-overlay-countdown">
            Следующий через {countdown}с
          </span>
        </div>
        <div className="game-results-grid">
          {sorted.map((s, i) => (
            <div
              key={s.user_id}
              className={`game-result-card${s.user_id === myId ? " game-result-card--me" : ""}`}
            >
              <div className="game-result-rank">#{i + 1}</div>
              {s.image_url && (
                <img
                  src={s.image_url}
                  alt={s.username}
                  className="game-result-img"
                />
              )}
              <div className="game-result-username">{s.username}</div>
              <div className="game-result-score">{s.score.toFixed(1)}</div>
              {s.comment && <p className="game-result-comment">{s.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

