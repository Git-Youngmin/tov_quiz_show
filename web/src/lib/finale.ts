/**
 * 최종 순위 발표(시상식)의 시간표. 진행 화면과 폰이 같은 표를 써서, 스크린에서 내 등수가 호명되는 순간에 폰도 같이 공개된다.
 *
 *   0 ─ 커튼이 열리고 진행자가 인사(intro) ─ 3등 호명 ─(step)─ 2등 호명 ─(step)─ "1등은…?!" 뜸 들이기(suspense) ─ 1등 호명 ─(tail)─ 나머지 순위·버튼
 *
 * 시상대 자리(m)는 최대 3명이고, 4등 이하는 맨 마지막(end)에 나온다.
 * 위치(position)는 0 = 1등, 1 = 2등, 2 = 3등 (동점이어도 순서대로 자리를 채운다).
 * 각 호명 직전 PRE_MS 동안 진행자가 "이어서 …등입니다" 하고 운을 띄운다.
 */
export const FINALE = {
  /** 커튼이 열리고 진행자가 인사하는 시간 (첫 호명까지) */
  intro: 5600,
  /** 한 명을 호명하고 → 머무르고 → 다음 운을 띄우기까지 */
  step: 4200,
  /** "그리고 1등은…?!" 뜸 들이기 */
  suspense: 3000,
  /** 1등 호명 후 나머지 순위가 나오기까지 */
  tail: 3400,
  /** 호명 전 운을 띄우는 시간 */
  pre: 1400,
} as const;

export interface FinaleSchedule {
  /** 시상대 위치별 호명 시각(ms). 없는 자리는 null */
  at: [number, number | null, number | null];
  /** "1등은…?!" 뜸 들이기 시작 시각 */
  suspenseAt: number;
  /** 나머지 순위와 버튼이 나오는 시각 */
  end: number;
}

/** m = 시상대에 오르는 사람 수 (1~3) */
export function finaleSchedule(m: number): FinaleSchedule {
  const places = Math.max(1, Math.min(3, m));
  let t: number = FINALE.intro;
  let t3: number | null = null;
  let t2: number | null = null;
  if (places >= 3) {
    t3 = t;
    t += FINALE.step;
  }
  if (places >= 2) {
    t2 = t;
    t += FINALE.step;
  }
  const t1 = t + FINALE.suspense;
  return { at: [t1, t2, t3], suspenseAt: t, end: t1 + FINALE.tail };
}

/** 등수 위치(0부터)가 공개되는 시각. 4등 이하(position >= 3)는 end */
export function revealTime(position: number, s: FinaleSchedule): number {
  if (position <= 2) return s.at[position] ?? s.end;
  return s.end;
}
