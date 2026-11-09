import { useEffect, type CSSProperties } from "react";

interface Layer {
  kind: "blob" | "ribbon";
  x: string;
  y: string;
  w: string;
  h: string;
  c: string;
  c2?: string;
  o: number;
  t: number; // 혼자 흐르는 속도(초)
  d: number;
  // 스크롤 1px 당 이동 배율: 값이 다르면 층마다 속도가 달라 깊이감이 생긴다
  kx: number;
  ky: number;
  kr?: number;
  hideSm?: boolean;
}

const LAYERS: Layer[] = [
  { kind: "blob", x: "-20vmax", y: "-18vmax", w: "70vmax", h: "70vmax", c: "#6d5dfc", o: 0.5, t: 30, d: 0, kx: 0.05, ky: -0.1, kr: 0.01 },
  { kind: "blob", x: "45vw", y: "-10vmax", w: "62vmax", h: "62vmax", c: "#1fd3c0", o: 0.38, t: 24, d: -6, kx: -0.07, ky: -0.16, kr: -0.012 },
  { kind: "blob", x: "10vw", y: "55vh", w: "68vmax", h: "68vmax", c: "#d1ad72", o: 0.3, t: 34, d: -12, kx: 0.04, ky: -0.22 },
  { kind: "blob", x: "60vw", y: "50vh", w: "55vmax", h: "55vmax", c: "#ff7ab8", o: 0.26, t: 28, d: -3, kx: -0.05, ky: -0.3, hideSm: true },
  { kind: "ribbon", x: "8vw", y: "6vh", w: "34vw", h: "88vh", c: "#2dd4bf", c2: "#8b5cf6", o: 0.42, t: 13, d: 0, kx: 0.03, ky: -0.12 },
  { kind: "ribbon", x: "46vw", y: "0vh", w: "30vw", h: "96vh", c: "#38bdf8", c2: "#a78bfa", o: 0.34, t: 17, d: -5, kx: -0.04, ky: -0.2, hideSm: true },
  { kind: "ribbon", x: "72vw", y: "10vh", w: "26vw", h: "80vh", c: "#34d399", c2: "#d1ad72", o: 0.3, t: 15, d: -9, kx: 0.05, ky: -0.28 },
];

/** 화면 전체에 깔리는 오로라. 스크롤하면 층마다 다른 속도로 흘러가고, 가만히 있어도 천천히 일렁인다. */
export function AuroraBackground() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      root.style.setProperty("--sy", String(Math.round(window.scrollY)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="aurora" aria-hidden>
      <div className="aurora__stars" />
      {LAYERS.map((l, i) => (
        <div
          key={i}
          className={`aurora__layer ${l.hideSm ? "aurora__layer--hide-sm" : ""}`}
          style={
            {
              "--x": l.x,
              "--y": l.y,
              "--w": l.w,
              "--h": l.h,
              "--kx": l.kx,
              "--ky": l.ky,
              "--kr": l.kr ?? 0,
            } as CSSProperties
          }
        >
          <div
            className={l.kind === "blob" ? "aurora__blob" : "aurora__ribbon"}
            style={{ "--c": l.c, "--c2": l.c2 ?? l.c, "--o": l.o, "--t": `${l.t}s`, "--d": `${l.d}s` } as CSSProperties}
          />
        </div>
      ))}
    </div>
  );
}
