/** 정답 1개의 기본 만점 */
export const BASE_POINTS = 1000;
/** 연속 정답 보너스 (streak >= STREAK_BONUS_MIN 일 때) */
export const STREAK_BONUS = 100;
export const STREAK_BONUS_MIN = 2;

/**
 * 시간 비례 점수: 1000 × { 1 − (응답 시간 / 제한 시간) / 2 }
 * - 즉시 응답 → 1000점, 제한 시간 끝에 응답 → 500점
 * - 응답 시간은 [0, 제한 시간] 으로 잘라서 계산
 */
export function timeScore(responseMs: number, timeLimitMs: number): number {
  if (timeLimitMs <= 0) return 0;
  const ratio = Math.min(Math.max(responseMs / timeLimitMs, 0), 1);
  return Math.round(BASE_POINTS * (1 - ratio / 2));
}

export interface AnswerScore {
  /** 이번 문제에서 얻은 점수 (보너스 포함) */
  points: number;
  /** 갱신된 연속 정답 수 */
  streak: number;
  /** 이번에 받은 연속 정답 보너스 */
  bonus: number;
}

/**
 * 한 문제의 채점. 오답/미응답이면 0점 + streak 초기화.
 * 정답이면 streak + 1, 그 값이 2 이상이면 +100 보너스.
 */
export function scoreAnswer(opts: {
  correct: boolean;
  responseMs: number;
  timeLimitMs: number;
  prevStreak: number;
}): AnswerScore {
  if (!opts.correct) return { points: 0, streak: 0, bonus: 0 };
  const streak = opts.prevStreak + 1;
  const bonus = streak >= STREAK_BONUS_MIN ? STREAK_BONUS : 0;
  return { points: timeScore(opts.responseMs, opts.timeLimitMs) + bonus, streak, bonus };
}
