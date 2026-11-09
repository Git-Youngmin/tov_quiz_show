import { useEffect, useState } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * from → to 로 숫자가 올라가는 값. active 가 true 가 되는 순간부터 durationMs 동안 움직인다.
 * (점수판에서 "이전 점수 → 이번 점수" 로 올라가는 연출용). 움직임 줄이기 설정이면 바로 최종값.
 */
export function useCountUp(from: number, to: number, active: boolean, durationMs = 1400): number {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!active) {
      setValue(from);
      return;
    }
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === to) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setValue(Math.round(from + (to - from) * easeOutCubic(p)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, active, durationMs]);

  return value;
}
