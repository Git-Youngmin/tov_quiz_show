import type { CSSProperties } from "react";

/** 불똥이 튀는 방향 (타는 끝에서 위·뒤쪽으로) */
const SPARKS: { dx: string; dy: string; delay: string }[] = [
  { dx: "-14px", dy: "-22px", delay: "0s" },
  { dx: "6px", dy: "-26px", delay: "0.23s" },
  { dx: "-24px", dy: "-8px", delay: "0.46s" },
];

/**
 * 제한 시간 표시: 밧줄이 타들어 가는 모양.
 *  - 한쪽 끝의 동그라미에 남은 초 (마지막 3초에는 빨갛게 변하며 흔들림)
 *  - 밧줄은 동그라미 쪽으로 줄어들고, 타는 끝에서 불꽃이 일렁이며 불똥이 튐
 * pct: 남은 시간 비율(0~100), left: 남은 초, large: 진행 화면용 큰 크기
 */
export function FuseTimer({ pct, left, urgent, large = false }: { pct: number; left: number; urgent: boolean; large?: boolean }) {
  const bomb = large ? "size-20 text-5xl" : "size-12 text-2xl";
  return (
    <div
      className={`fuse flex items-center ${large ? "gap-5" : "fuse--sm gap-3"} ${urgent ? "fuse--urgent" : ""}`}
      role="timer"
      aria-label={`남은 시간 ${left}초`}
    >
      <span className={`fuse__bomb ${bomb}`}>
        <span key={left} className="fuse__num">
          {left}
        </span>
      </span>
      <div className="fuse__track" style={{ marginRight: large ? "1.4rem" : "1.1rem" }}>
        <div className="fuse__rope" style={{ width: `${pct}%` }}>
          {pct > 0 && (
            <>
              {SPARKS.map((s, i) => (
                <span key={i} className="fuse__spark" style={{ "--dx": s.dx, "--dy": s.dy, animationDelay: s.delay } as CSSProperties} aria-hidden />
              ))}
              <span className="fuse__flame" aria-hidden>
                🔥
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
