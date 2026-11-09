import type { RankEntry } from "@tob/shared";
import { CharacterAvatar } from "./CharacterAvatar.tsx";

export function Leaderboard({ entries, highlightId }: { entries: RankEntry[]; highlightId?: string }) {
  if (entries.length === 0) return <p className="text-center text-mist">참가자가 없어요</p>;
  return (
    <ol className="space-y-2">
      {entries.map((e) => (
        <li
          key={e.playerId}
          className={`flex items-center gap-3 rounded-xl px-4 py-2 ${
            e.playerId === highlightId ? "bg-gold-400 text-navy-950" : "bg-white/10"
          }`}
        >
          <span className="w-8 text-xl font-black">{e.rank}</span>
          <CharacterAvatar character={e.character} size={38} bust mood={e.rank === 1 ? "cheer" : "idle"} seed={e.playerId} />
          <span className="flex-1 truncate text-lg font-bold">{e.nickname}</span>
          {e.streak >= 2 && <span className="text-sm">🔥{e.streak}</span>}
          <span className="font-mono text-lg font-bold">{e.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
