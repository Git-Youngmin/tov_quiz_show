/** 정답 1개의 기본 만점 */
export const BASE_POINTS = 1000;

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

/** 한 문제의 채점: 오답/미응답이면 0점, 정답이면 시간 비례 점수 (연속 정답 보너스는 없음) */
export function scoreAnswer(opts: { correct: boolean; responseMs: number; timeLimitMs: number }): number {
  return opts.correct ? timeScore(opts.responseMs, opts.timeLimitMs) : 0;
}
