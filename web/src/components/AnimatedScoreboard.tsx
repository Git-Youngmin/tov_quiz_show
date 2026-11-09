import { useEffect, useMemo, useState } from "react";
import type { BoardEntry } from "@tob/shared";
import { useCountUp } from "../lib/useCountUp.ts";
import { CharacterAvatar, type Mood } from "./CharacterAvatar.tsx";

const ROW_H = 84;
const GAP = 12;
/** 점수가 올라가는 시간 */
const COUNT_MS = 1500;

const byPrev = (a: BoardEntry, b: BoardEntry) => a.prevRank - b.prevRank || b.prevScore - a.prevScore || a.nickname.localeCompare(b.nickname);
const byNew = (a: BoardEntry, b: BoardEntry) => a.rank - b.rank || b.score - a.score || a.nickname.localeCompare(b.nickname);

/**
 * 카훗식 점수판.
 *   1) 이전 라운드 점수와 순서로 먼저 보여 주고
 *   2) 이번 라운드에 얻은 점수(+N)가 붙으면서 숫자가 올라가고
 *   3) 새 순위 자리로 줄이 쑥 올라가고 내려가며 순위가 뒤바뀜 — 오른 캐릭터는 폴짝, 내린 캐릭터는 풀이 죽음
 */
export function AnimatedScoreboard({ entries }: { entries: BoardEntry[] }) {
  // 0 = 이전 점수 · 1 = 점수 오르는 중 · 2 = 새 순위로 재정렬
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(() => setPhase(2), 900 + COUNT_MS + 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [entries]);

  const order = useMemo(() => [...entries].sort(phase < 2 ? byPrev : byNew), [entries, phase]);
  const yOf = new Map(order.map((e, i) => [e.playerId, i * (ROW_H + GAP)]));

  if (entries.length === 0) return <p className="text-center text-mist">참가자가 없어요</p>;

  return (
    <ol className="relative" style={{ height: entries.length * (ROW_H + GAP) }} aria-label="점수판">
      {entries.map((e) => (
        <BoardRow key={e.playerId} e={e} y={yOf.get(e.playerId) ?? 0} phase={phase} />
      ))}
    </ol>
  );
}

function BoardRow({ e, y, phase }: { e: BoardEntry; y: number; phase: 0 | 1 | 2 }) {
  const delta = e.prevRank - e.rank; // + 면 순위 상승
  const gained = e.score - e.prevScore;
  const score = useCountUp(e.prevScore, e.score, phase >= 1, COUNT_MS);
  const settled = phase === 2;
  const moved = settled && delta !== 0;
  const mood: Mood = settled ? (delta > 0 ? "cheer" : delta < 0 ? "sad" : "idle") : phase === 1 && gained > 0 ? "happy" : "idle";
  const shownRank = settled ? e.rank : e.prevRank;
  const isLeader = settled && e.rank === 1;

  return (
    <li
      className={`board-row glass flex items-center gap-4 rounded-2xl px-5 ${moved && delta > 0 ? "is-rise" : ""} ${moved && delta < 0 ? "is-fall" : ""} ${
        isLeader ? "!border-gold-300/70 !bg-gold-400/25" : ""
      }`}
      style={{ height: ROW_H, transform: `translateY(${y}px)`, zIndex: moved && delta > 0 ? 20 : 1 }}
    >
      <span key={shownRank} className={`w-12 text-center font-serif-kr text-4xl font-black ${settled ? "rank-badge" : ""}`}>
        {shownRank}
      </span>

      <div className="relative -my-2 shrink-0" style={{ width: 64 }}>
        {isLeader && (
          <span className="crown-drop absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-3xl" aria-hidden>
            👑
          </span>
        )}
        <div className={moved ? (delta > 0 ? "fx-rise" : "fx-fall") : ""}>
          <CharacterAvatar character={e.character} size={64} bust mood={mood} seed={e.playerId} />
        </div>
      </div>

      <span className="min-w-0 flex-1 truncate text-2xl font-extrabold sm:text-3xl">{e.nickname}</span>

      {moved && (
        <span key={`d${delta}`} className={`text-xl font-black ${delta > 0 ? "arrow-bounce-up text-green-300" : "arrow-bounce-down text-red-300"}`}>
          {delta > 0 ? "▲" : "▼"}
          {Math.abs(delta)}
        </span>
      )}
      {phase >= 1 && gained > 0 && (
        <span className="gain-badge rounded-full bg-green-400/25 px-3 py-1 text-lg font-black text-green-200">+{gained.toLocaleString()}</span>
      )}
      <span className="w-32 text-right font-mono text-3xl font-black tabular-nums sm:text-4xl">{score.toLocaleString()}</span>
    </li>
  );
}
