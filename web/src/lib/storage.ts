import { CHARACTER_COLORS, CHARACTER_SHAPES, isCharacter, type Character } from "@tob/shared";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** 기기별 고유 id — 재접속해도 점수가 유지되도록 WebSocket connection id 로 사용 */
export function getPlayerId(): string {
  return safe(() => {
    let id = localStorage.getItem("tob:playerId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("tob:playerId", id);
    }
    return id;
  }, crypto.randomUUID());
}

export interface Profile {
  nickname: string;
  character: Character;
}

const DEFAULT_PROFILE: Profile = {
  nickname: "",
  character: { shape: CHARACTER_SHAPES[0], color: CHARACTER_COLORS[4] },
};

export function loadProfile(): Profile {
  return safe(() => {
    const p = JSON.parse(localStorage.getItem("tob:profile") ?? "null") as Profile | null;
    return p && typeof p.nickname === "string" && isCharacter(p.character) ? p : DEFAULT_PROFILE;
  }, DEFAULT_PROFILE);
}

export function saveProfile(p: Profile) {
  safe(() => localStorage.setItem("tob:profile", JSON.stringify(p)), undefined);
}
