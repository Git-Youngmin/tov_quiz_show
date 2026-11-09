import { useMemo, type CSSProperties } from "react";

const COLORS = ["#ffd36b", "#ff7a9a", "#6ee7f9", "#ffffff", "#b69cff", "#7ae7a0", "#ff9f5a"];

/** 항상 같은 모양이 나오는 간단한 난수 (렌더마다 위치가 바뀌지 않게) */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 화면 위에서 쏟아지는 색종이. 가벼운 CSS 애니메이션이라 count 100 정도까지 무리 없다 */
export function Confetti({ count = 80, seed = 7 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
    const rnd = lcg(seed);
    return Array.from({ length: count }, () => ({
      left: rnd() * 100,
      delay: rnd() * 4,
      dur: 3.8 + rnd() * 3.4,
      w: 7 + rnd() * 8,
      color: COLORS[Math.floor(rnd() * COLORS.length)],
      sway: (rnd() - 0.5) * 240,
      rot: (rnd() > 0.5 ? 1 : -1) * (360 + rnd() * 720),
    }));
  }, [count, seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              "--w": `${p.w}px`,
              "--c": p.color,
              "--dur": `${p.dur}s`,
              "--delay": `${p.delay}s`,
              "--sway": `${p.sway}px`,
              "--rot": `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
