import type { RankEntry, RoomState } from "@tob/shared";

/** RoomState.players → 점수순 순위 (서버와 같은 규칙: 동점 같은 등수) */
export function rankPlayers(state: RoomState): RankEntry[] {
  const sorted = Object.entries(state.players).sort(([, a], [, b]) => b.score - a.score);
  let rank = 0;
  let prev = Number.NaN;
  return sorted.map(([playerId, p], i) => {
    if (p.score !== prev) {
      rank = i + 1;
      prev = p.score;
    }
    return { playerId, nickname: p.nickname, character: p.character, score: p.score, streak: p.streak, rank };
  });
}
