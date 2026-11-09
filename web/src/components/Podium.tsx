import type { RankEntry } from "@tob/shared";
import { CharacterAvatar } from "./CharacterAvatar.tsx";

const MEDAL = ["🥇", "🥈", "🥉"];

/** 발표 순서: 3등 → 2등 → 1등 (뒤로 갈수록 뜸을 들여서 두구두구) */
const REVEAL_DELAY: Record<number, string> = { 3: "0.3s", 2: "1.6s", 1: "3.2s" };

/** 최종 시상대: 2등 · 1등 · 3등 순서로 세우고, 3등부터 차례로 등장해 1등은 만세 */
export function Podium({ top }: { top: RankEntry[] }) {
  if (top.length === 0) return null;
  const order = [top[1], top[0], top[2]].filter(Boolean) as RankEntry[];
  const height = (rank: number) => (rank === 1 ? 120 : rank === 2 ? 86 : 64);
  return (
    <div className="flex items-end justify-center gap-3 pt-6" role="list" aria-label="시상대">
      {order.map((e) => (
        <div
          key={e.playerId}
          role="listitem"
          className="animate-pop flex w-32 flex-col items-center sm:w-44"
          style={{ animationDelay: REVEAL_DELAY[e.rank] ?? "0s" }}
        >
          <CharacterAvatar character={e.character} size={e.rank === 1 ? 120 : 92} mood={e.rank === 1 ? "cheer" : "idle"} seed={e.playerId} />
          <p className="mt-1 max-w-full truncate text-lg font-extrabold">{e.nickname}</p>
          <p className="font-mono text-sm text-gold-200">{e.score.toLocaleString()}점</p>
          <div
            className="glass mt-2 grid w-full place-items-center rounded-t-2xl text-3xl"
            style={{ height: height(e.rank), background: "linear-gradient(180deg, rgb(209 173 114 / .35), rgb(255 255 255 / .06))" }}
          >
            <span aria-label={`${e.rank}등`}>{MEDAL[e.rank - 1] ?? e.rank}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
