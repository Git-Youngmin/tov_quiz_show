import { useId, type CSSProperties, type ReactElement } from "react";
import type { Character, CharacterColor, CharacterShape } from "@tob/shared";

/** 색마다 (밝은 면 / 기본 / 어두운 면) 3단계 — 입체 음영과 팔·다리 색에 쓴다 */
export const PALETTE: Record<CharacterColor, { light: string; base: string; dark: string }> = {
  red: { light: "#ff9aa5", base: "#ff6b7a", dark: "#d93f55" },
  orange: { light: "#ffc588", base: "#ffa24d", dark: "#e07a1f" },
  yellow: { light: "#ffeb94", base: "#ffd84d", dark: "#e0ae16" },
  green: { light: "#8ae8b5", base: "#4fd18b", dark: "#26a566" },
  blue: { light: "#8cc4ff", base: "#4da3ff", dark: "#2b78d9" },
  purple: { light: "#c9adff", base: "#a97bff", dark: "#7c4bdb" },
};

/** 색상 선택 버튼 등에서 쓰는 대표색 */
export const COLOR_HEX: Record<CharacterColor, string> = {
  red: PALETTE.red.base,
  orange: PALETTE.orange.base,
  yellow: PALETTE.yellow.base,
  green: PALETTE.green.base,
  blue: PALETTE.blue.base,
  purple: PALETTE.purple.base,
};

export const COLOR_LABEL: Record<CharacterColor, string> = {
  red: "빨강",
  orange: "주황",
  yellow: "노랑",
  green: "초록",
  blue: "파랑",
  purple: "보라",
};

/** 로비에서 고르는 "모양" 이름. 모양마다 다른 캐릭터로 그려진다 */
export const SHAPE_LABEL: Record<CharacterShape, string> = {
  capsule: "캡슐",
  box: "상자",
  sphere: "구",
  cone: "원뿔",
};
export const SHAPE_NICK: Record<CharacterShape, string> = {
  capsule: "젤리",
  box: "로봇",
  sphere: "고양이",
  cone: "마법사",
};

export type Mood = "idle" | "happy" | "cheer" | "sad" | "wave" | "sleepy";

const INK = "#1b2340";
const GLOVE = "#f7f9ff";
const GLOVE_EDGE = "#c9d3ee";
const SKIN = { light: "#fff3e8", base: "#ffe2cc", dark: "#f3b99a" };

/** 얼굴 위치/크기 (모양마다 머리 크기가 달라서) */
interface Face {
  cx: number;
  ey: number; // 눈 y
  dx: number; // 눈 사이 반간격
  my: number; // 입 y
  by: number; // 볼터치 y
  bx: number; // 볼터치 x 오프셋
}
const FACE: Record<CharacterShape, Face> = {
  capsule: { cx: 60, ey: 56, dx: 15, my: 70, by: 66, bx: 25 },
  box: { cx: 60, ey: 56, dx: 15, my: 69, by: 66, bx: 24 },
  sphere: { cx: 60, ey: 53, dx: 16, my: 73, by: 67, bx: 26 },
  cone: { cx: 60, ey: 66, dx: 12.5, my: 79, by: 76, bx: 20 },
};

/** 문자열/숫자 → 0~1 (캐릭터마다 움직임 타이밍을 어긋나게) */
function hash01(seed: string | number): number {
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

export interface CharacterAvatarProps {
  character: Character;
  /** 가로 크기(px) */
  size?: number;
  mood?: Mood;
  /** 움직임 타이밍을 달리하는 값 (닉네임/id 등) */
  seed?: string | number;
  /** 나타날 때 통통 튀며 등장 */
  popIn?: boolean;
  /** 머리~가슴만 보여 주기 (작은 목록·헤더용) */
  bust?: boolean;
  className?: string;
}

/**
 * 치비 캐릭터 — 머리 · 몸통 · 팔과 장갑 · 다리와 신발이 따로 있고, 큰 눈과 볼터치가 있다.
 * 상태(mood)에 따라 머리·팔·다리·눈이 각각 움직인다(index.css 의 .tob-char). 모양마다 다른 캐릭터:
 * 캡슐=젤리, 상자=로봇, 구=고양이, 원뿔=마법사. 전부 SVG 로 직접 그려서 색 6종이 그대로 적용된다.
 */
export function CharacterAvatar({ character, size = 56, mood = "idle", seed = 0, popIn = false, bust = false, className = "" }: CharacterAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const { light, base, dark } = PALETTE[character.color];
  const shape = character.shape;
  const f = FACE[shape];
  const delay = `${-(hash01(seed) * 6).toFixed(2)}s`;
  const happy = mood === "happy" || mood === "cheer";
  const closedEyes = happy || mood === "sleepy";
  const id = (n: string) => `${n}${uid}`;
  const eyeX = [f.cx - f.dx, f.cx + f.dx];

  /** 머리 모양 (채우기·클립 둘 다에 쓴다) */
  const headShape = (fill: string): ReactElement => {
    switch (shape) {
      case "capsule":
        return <rect x="27" y="14" width="66" height="74" rx="31" fill={fill} />;
      case "box":
        return <rect x="25" y="22" width="70" height="64" rx="18" fill={fill} />;
      case "sphere":
        return <ellipse cx="60" cy="55" rx="37" ry="34" fill={fill} />;
      case "cone":
        return <circle cx="60" cy="64" r="27" fill={fill} />;
    }
  };

  /** 머리 뒤에 깔리는 것 (새싹, 안테나, 귀) */
  const behind = (): ReactElement | null => {
    switch (shape) {
      case "capsule":
        return (
          <g fill="none" stroke={dark} strokeWidth="3.4" strokeLinecap="round">
            <path d="M60 17 C51 7 55 -3 66 1 C62 6 67 10 62 15" />
            <path d="M60 17 C69 9 78 11 76 3 C70 5 64 8 61 15" fill={light} stroke={dark} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
        );
      case "box":
        return (
          <g>
            <line x1="60" y1="24" x2="60" y2="8" stroke={dark} strokeWidth="3.4" strokeLinecap="round" />
            <circle cx="60" cy="6" r="5.2" fill={light} stroke={dark} strokeWidth="2" />
            <circle cx="24" cy="56" r="6" fill={dark} />
            <circle cx="96" cy="56" r="6" fill={dark} />
          </g>
        );
      case "sphere":
        return (
          <g>
            <path d="M29 42 Q25 12 36 11 Q43 11 55 25 Z" fill={base} stroke={dark} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M35 37 Q33 20 38 19 Q43 20 50 27 Z" fill="#ffb7c9" />
            <path d="M91 42 Q95 12 84 11 Q77 11 65 25 Z" fill={base} stroke={dark} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M85 37 Q87 20 82 19 Q77 20 70 27 Z" fill="#ffb7c9" />
          </g>
        );
      case "cone":
        return null;
    }
  };

  /** 머리 위/앞에 얹는 것 (로봇 얼굴판, 고양이 코·수염, 마법사 모자) */
  const front = (): ReactElement | null => {
    switch (shape) {
      case "capsule":
        return null;
      case "box":
        return <rect x="33" y="33" width="54" height="46" rx="15" fill={`url(#${id("p")})`} stroke={dark} strokeOpacity="0.35" strokeWidth="1.2" />;
      case "sphere":
        return (
          <g>
            <path d="M57 64 h6 l-3 3.6 z" fill="#ff8aa6" />
            <g stroke={INK} strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round">
              <line x1="30" y1="62" x2="17" y2="58" />
              <line x1="30" y1="67" x2="16" y2="68" />
              <line x1="90" y1="62" x2="103" y2="58" />
              <line x1="90" y1="67" x2="104" y2="68" />
            </g>
          </g>
        );
      case "cone":
        return (
          <g>
            <ellipse cx="60" cy="43" rx="39" ry="9.5" fill={dark} />
            <path d="M60 -3 Q65 1 77 41 Q60 48 43 41 Q55 1 60 -3 Z" fill={`url(#${id("h")})`} />
            <path d="M46 33 Q60 40 75 33 L76.5 39 Q60 47 44.5 39 Z" fill="#e8cf9c" />
            <path d="M61 13 l1.8 4.4 4.7.4 -3.6 3 1.1 4.6 -4-2.5 -4 2.5 1.1 -4.6 -3.6 -3 4.7 -.4z" fill="#fff0b8" />
          </g>
        );
    }
  };

  /** 몸통 */
  const torso = (): ReactElement => {
    switch (shape) {
      case "capsule":
        return (
          <g>
            <rect x="44" y="84" width="32" height="35" rx="14" fill={`url(#${id("t")})`} />
            <ellipse cx="60" cy="104" rx="9" ry="10" fill="#fff" opacity="0.28" />
          </g>
        );
      case "box":
        return (
          <g>
            <rect x="42" y="84" width="36" height="35" rx="9" fill={`url(#${id("t")})`} />
            <rect x="51" y="94" width="18" height="12" rx="3.5" fill="#f2f6ff" opacity="0.9" />
            <circle cx="56" cy="100" r="1.8" fill={base} />
            <circle cx="64" cy="100" r="1.8" fill={dark} />
          </g>
        );
      case "sphere":
        return (
          <g>
            <path d="M77 110 Q100 110 95 90" fill="none" stroke={base} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx="60" cy="102" rx="20" ry="18" fill={`url(#${id("t")})`} />
            <ellipse cx="60" cy="105" rx="11.5" ry="12" fill="#fff8ee" opacity="0.92" />
          </g>
        );
      case "cone":
        return (
          <g>
            <path d="M48 90 Q60 85 72 90 L84 121 Q60 128 36 121 Z" fill={`url(#${id("t")})`} />
            <path d="M43 107 Q60 112 77 107 L78.5 113 Q60 118.5 41.5 113 Z" fill="#e8cf9c" />
          </g>
        );
    }
  };

  const limb = shape === "cone" ? base : dark;
  const ink = INK;
  const { cx } = f;
  const faceColors = shape === "cone" ? SKIN : { light, base, dark };

  const viewBox = bust ? "14 -6 92 106" : "0 -6 120 166";
  const height = bust ? (size * 106) / 92 : (size * 166) / 120;

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={height}
      role="img"
      aria-label={`${COLOR_LABEL[character.color]} ${SHAPE_NICK[shape]} 캐릭터`}
      className={`tob-char ${bust ? "tob-bust" : ""} ${popIn ? "animate-pop" : ""} ${className}`}
      data-mood={mood}
      style={{ "--d": delay } as CSSProperties}
    >
      <defs>
        <radialGradient id={id("h")} cx="35%" cy="25%" r="95%">
          <stop offset="0" stopColor={faceColors.light} />
          <stop offset="0.55" stopColor={faceColors.base} />
          <stop offset="1" stopColor={faceColors.dark} />
        </radialGradient>
        <linearGradient id={id("t")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.6" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={id("p")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe6fb" />
        </linearGradient>
        <radialGradient id={id("e")} cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#3a4a8c" />
          <stop offset="0.6" stopColor={ink} />
          <stop offset="1" stopColor="#0d1226" />
        </radialGradient>
        <radialGradient id={id("s")}>
          <stop offset="0" stopColor="#020611" stopOpacity="0.75" />
          <stop offset="1" stopColor="#020611" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("c")}>{headShape("#000")}</clipPath>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse className="c-shadow" cx="60" cy="146" rx="30" ry="6.5" fill={`url(#${id("s")})`} />

      <g className="c-body">
        {/* 다리 + 신발 */}
        <g className="c-leg-l">
          <line x1="52" y1="112" x2="49" y2="136" stroke={limb} strokeWidth="8.5" strokeLinecap="round" />
          <ellipse cx="46" cy="141" rx="12.5" ry="6.4" fill={GLOVE} stroke={GLOVE_EDGE} strokeWidth="1.2" />
          <path d="M34 143 Q46 148 58.5 143" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <g className="c-leg-r">
          <line x1="68" y1="112" x2="71" y2="136" stroke={limb} strokeWidth="8.5" strokeLinecap="round" />
          <ellipse cx="74" cy="141" rx="12.5" ry="6.4" fill={GLOVE} stroke={GLOVE_EDGE} strokeWidth="1.2" />
          <path d="M61.5 143 Q74 148 86 143" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {torso()}

        {/* 머리 (고개를 갸웃거리는 단위) */}
        <g className="c-head">
          {behind()}
          {headShape(`url(#${id("h")})`)}
          {/* 머리 하이라이트 + 아래쪽 은은한 그림자 */}
          <g clipPath={`url(#${id("c")})`}>
            <ellipse className="c-static" cx="42" cy="34" rx="15" ry="9" fill="#fff" opacity="0.3" transform="rotate(-24 42 34)" />
            <ellipse cx="66" cy="96" rx="48" ry="16" fill={shape === "cone" ? SKIN.dark : dark} opacity="0.22" />
          </g>
          {front()}

          {/* 볼터치 */}
          <ellipse cx={cx - f.bx} cy={f.by} rx="5.4" ry="3.4" fill="#ff7a9a" opacity="0.5" />
          <ellipse cx={cx + f.bx} cy={f.by} rx="5.4" ry="3.4" fill="#ff7a9a" opacity="0.5" />

          {/* 눈썹 */}
          {!happy && mood !== "sleepy" && (
            <g fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
              {eyeX.map((x, i) => {
                const s = i === 0 ? 1 : -1; // 왼쪽/오른쪽 대칭
                return mood === "sad" ? (
                  <path key={x} d={`M${x - 5 * s} ${f.ey - 14} L${x + 5 * s} ${f.ey - 17.5}`} />
                ) : (
                  <path key={x} d={`M${x - 5} ${f.ey - 15} Q${x} ${f.ey - 18} ${x + 5} ${f.ey - 15}`} />
                );
              })}
            </g>
          )}

          {/* 눈: 큰 애니메이션풍 눈 + 하이라이트 */}
          {closedEyes ? (
            <g fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round">
              {eyeX.map((x) =>
                happy ? (
                  <path key={x} d={`M${x - 6.5} ${f.ey + 2} Q${x} ${f.ey - 8} ${x + 6.5} ${f.ey + 2}`} />
                ) : (
                  <path key={x} d={`M${x - 6.5} ${f.ey - 1} Q${x} ${f.ey + 5} ${x + 6.5} ${f.ey - 1}`} />
                ),
              )}
            </g>
          ) : (
            <g className="c-eyes">
              <g className="c-pupils">
                {eyeX.map((x) => (
                  <g key={x}>
                    <ellipse cx={x} cy={f.ey} rx="7.4" ry="9.6" fill={`url(#${id("e")})`} />
                    <circle cx={x - 2.5} cy={f.ey - 3.6} r="3" fill="#fff" />
                    <circle cx={x + 2.6} cy={f.ey + 3.4} r="1.4" fill="#fff" opacity="0.9" />
                  </g>
                ))}
              </g>
            </g>
          )}

          {/* 입 */}
          {happy ? (
            <g>
              <path d={`M${cx - 7} ${f.my - 2} Q${cx} ${f.my + 14} ${cx + 7} ${f.my - 2} Z`} fill="#7a2338" />
              <ellipse cx={cx} cy={f.my + 5.2} rx="3.4" ry="2" fill="#ff8aa6" />
            </g>
          ) : mood === "sad" ? (
            <path d={`M${cx - 5} ${f.my + 4} Q${cx} ${f.my - 2} ${cx + 5} ${f.my + 4}`} fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
          ) : mood === "sleepy" ? (
            <ellipse cx={cx} cy={f.my + 1} rx="2.8" ry="2.4" fill="#7a2338" />
          ) : (
            <path d={`M${cx - 5} ${f.my} Q${cx - 2.5} ${f.my + 4.5} ${cx} ${f.my + 1} Q${cx + 2.5} ${f.my + 4.5} ${cx + 5} ${f.my}`} fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {mood === "sad" && <path d={`M${eyeX[1] + 6} ${f.ey + 6} q3 5 0 8 q-3 -3 0 -8 Z`} fill="#8fd3ff" />}
          {mood === "sleepy" && (
            <text className="c-zzz" x={cx + f.dx + 14} y={f.ey - 16} fontSize="15" fontWeight="800" fill="#fff" fontFamily="sans-serif">
              z
            </text>
          )}
        </g>

        {/* 팔 + 장갑 (머리 앞에 나와야 만세 할 때 보인다) */}
        <g className="c-arm-l">
          <line x1="46" y1="92" x2="33" y2="113" stroke={limb} strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="31.5" cy="115" r="7.2" fill={GLOVE} stroke={GLOVE_EDGE} strokeWidth="1.2" />
        </g>
        <g className="c-arm-r">
          <line x1="74" y1="92" x2="87" y2="113" stroke={limb} strokeWidth="7.5" strokeLinecap="round" />
          <circle cx="88.5" cy="115" r="7.2" fill={GLOVE} stroke={GLOVE_EDGE} strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}
