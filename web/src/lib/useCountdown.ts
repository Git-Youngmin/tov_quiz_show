import { useEffect, useState } from "react";
import { nowMs } from "./clock.ts";

/** endsAt(서버 시각, ms) 까지 남은 초 (올림) */
export function useCountdown(endsAt: number | null | undefined): number {
  const calc = () => (endsAt ? Math.max(0, Math.ceil((endsAt - nowMs()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!endsAt) return;
    const t = setInterval(() => setLeft(calc()), 200);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}

/**
 * 서버 기준 현재 시각을 intervalMs 마다 갱신해서 돌려준다 (카운트다운 소개, 줄어드는 시간 막 등 부드러운 표시용).
 * active 가 false 면 갱신을 멈춘다.
 */
export function useServerNow(intervalMs = 100, active = true): number {
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    if (!active) return;
    setNow(nowMs());
    const t = setInterval(() => setNow(nowMs()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, active]);
  return now;
}
