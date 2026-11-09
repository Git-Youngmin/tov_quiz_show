import { useId, type CSSProperties } from "react";
import type { Character, CharacterColor, CharacterShape } from "@tob/shared";

/** 색마다 (밝은 면 / 기본 / 어두운 면) 3단계 — 입체 음영과 팔·발 색에 쓴다 */
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

export const SHAPE_LABEL: Record<CharacterShape, string> = {
  capsule: "캡슐",
  box: "상자",
  sphere: "구",
  cone: "원뿔",
};

export type Mood = "idle" | "happy" | "cheer" | "sad" | "wave" | "sleepy";

interface Geometry {
  /** 얼굴 중심 */
  fx: number;
  fy: number;
  /** 눈 사이 반간격 / 볼터치 x 오프셋 */
  eye: number;
  cheek: number;
  /** 팔 붙는 위치 (왼쪽 x, 오른쪽 x, y) */
  armL: number;
  armR: number;
  armY: number;
  /** 발 x 두 곳 */
  feet: [number, number];
  /** 하이라이트 (x, y, rx, ry, 회전) */
  hl: [number, number, number, number, number];
}

const GEO: Record<CharacterShape, Geometry> = {
  capsule: { fx: 50, fy: 44, eye: 11, cheek: 19, armL: 26, armR: 74, armY: 62, feet: [40, 60], hl: [38, 30, 5, 13, -8] },
  box: { fx: 46, fy: 64, eye: 11, cheek: 18, armL: 18, armR: 84, armY: 66, feet: [34, 58], hl: [32, 54, 5, 9, 0] },
  sphere: { fx: 50, fy: 56, eye: 12, cheek: 21, armL: 13, armR: 87, armY: 64, feet: [38, 62], hl: [32, 38, 7, 12, 35] },
  cone: { fx: 50, fy: 68, eye: 9.5, cheek: 17, armL: 22, armR: 78, armY: 80, feet: [38, 62], hl: [43, 44, 3.6, 12, 18] },
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
  /** 가로 크기(px). 세로는 1.2배 */
  size?: number;
  mood?: Mood;
  /** 움직임 타이밍을 달리하는 값 (닉네임/id 등) */
  seed?: string | number;
  /** 나타날 때 통통 튀며 등장 */
  popIn?: boolean;
  className?: string;
}

/**
 * 2D 캐릭터 — 얼굴·팔·발·바닥 그림자·입체 음영이 있고, 상태(mood)에 따라 움직인다.
 * 움직임은 CSS(index.css 의 .tob-char) 로만 처리해서 수십 마리가 있어도 가볍다.
 */
export function CharacterAvatar({ character, size = 56, mood = "idle", seed = 0, popIn = false, className = "" }: CharacterAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const { light, base, dark } = PALETTE[character.color];
  const g = GEO[character.shape];
  const gradId = `g${uid}`;
  const delay = `${-(hash01(seed) * 5).toFixed(2)}s`;
  const happy = mood === "happy" || mood === "cheer";
  const closedEyes = happy || mood === "sleepy";
  const ink = "#1b2340";
  const { fx, fy } = g;

  const eyeX = [fx - g.eye, fx + g.eye];
  const body = (() => {
    switch (character.shape) {
      case "capsule":
        return <rect x="28" y="12" width="44" height="88" rx="22" fill={`url(#${gradId})`} />;
      case "box":
        return (
          <>
            <path d="M22 40 L32 25 L82 25 L72 40 Z" fill={light} stroke={light} strokeWidth="4" strokeLinejoin="round" />
            <path d="M72 40 L82 25 L82 83 L72 98 Z" fill={dark} stroke={dark} strokeWidth="4" strokeLinejoin="round" />
            <rect x="20" y="40" width="52" height="58" rx="9" fill={`url(#${gradId})`} />
          </>
        );
      case "sphere":
        return <circle cx="50" cy="60" r="38" fill={`url(#${gradId})`} />;
      case "cone":
        return (
          <path
            d="M50 12 Q56 12 60 22 L84 82 Q90 98 72 98 L28 98 Q10 98 16 82 L40 22 Q44 12 50 12 Z"
            fill={`url(#${gradId})`}
          />
        );
    }
  })();

  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      role="img"
      aria-label={`${COLOR_LABEL[character.color]} ${SHAPE_LABEL[character.shape]} 캐릭터`}
      className={`tob-char ${popIn ? "animate-pop" : ""} ${className}`}
      data-mood={mood}
      style={{ "--d": delay } as CSSProperties}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="25%" r="90%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`s${uid}`}>
          <stop offset="0" stopColor="#020611" stopOpacity="0.75" />
          <stop offset="1" stopColor="#020611" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse className="c-shadow" cx="50" cy="106" rx="30" ry="6.5" fill={`url(#s${uid})`} />

      <g className="c-body">
        {/* 발 · 팔 (몸 뒤에서 살짝 튀어나옴) */}
        <ellipse cx={g.feet[0]} cy="98" rx="9" ry="5.5" fill={dark} />
        <ellipse cx={g.feet[1]} cy="98" rx="9" ry="5.5" fill={dark} />
        <ellipse className="c-arm-l" cx={g.armL - 3} cy={g.armY + 8} rx="5.6" ry="10" fill={dark} />
        <ellipse className="c-arm-r" cx={g.armR + 3} cy={g.armY + 8} rx="5.6" ry="10" fill={dark} />

        {body}

        {/* 반짝이는 하이라이트 */}
        <ellipse
          cx={g.hl[0]}
          cy={g.hl[1]}
          rx={g.hl[2]}
          ry={g.hl[3]}
          fill="#fff"
          opacity="0.32"
          transform={`rotate(${g.hl[4]} ${g.hl[0]} ${g.hl[1]})`}
        />

        {/* 볼터치 */}
        <ellipse cx={fx - g.cheek} cy={fy + 9} rx="4.6" ry="3" fill="#ff7a9a" opacity="0.55" />
        <ellipse cx={fx + g.cheek} cy={fy + 9} rx="4.6" ry="3" fill="#ff7a9a" opacity="0.55" />

        {/* 눈 */}
        {closedEyes ? (
          <g fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round">
            {eyeX.map((x) =>
              happy ? (
                <path key={x} d={`M${x - 5.5} ${fy + 1.5} Q${x} ${fy - 6} ${x + 5.5} ${fy + 1.5}`} />
              ) : (
                <path key={x} d={`M${x - 5.5} ${fy - 1} Q${x} ${fy + 4} ${x + 5.5} ${fy - 1}`} />
              ),
            )}
          </g>
        ) : (
          <g className="c-eyes">
            {eyeX.map((x) => (
              <circle key={`w${x}`} cx={x} cy={fy} r="7.2" fill="#fff" />
            ))}
            <g className="c-pupils">
              {eyeX.map((x) => (
                <g key={`p${x}`}>
                  <circle cx={x + 0.4} cy={fy + 0.8} r="3.8" fill={ink} />
                  <circle cx={x + 1.8} cy={fy - 0.8} r="1.3" fill="#fff" />
                </g>
              ))}
            </g>
          </g>
        )}

        {/* 입 */}
        {happy ? (
          <g>
            <path d={`M${fx - 6.5} ${fy + 8} Q${fx} ${fy + 22} ${fx + 6.5} ${fy + 8} Z`} fill="#7a2338" />
            <ellipse cx={fx} cy={fy + 14.5} rx="3.2" ry="2" fill="#ff8aa6" />
          </g>
        ) : mood === "sad" ? (
          <path d={`M${fx - 5} ${fy + 14} Q${fx} ${fy + 8.5} ${fx + 5} ${fy + 14}`} fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        ) : mood === "sleepy" ? (
          <ellipse cx={fx} cy={fy + 11} rx="2.6" ry="2.2" fill="#7a2338" />
        ) : (
          <path d={`M${fx - 5} ${fy + 8.5} Q${fx} ${fy + 14} ${fx + 5} ${fy + 8.5}`} fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        )}

        {/* 슬픈 눈물 · 졸음 zZ */}
        {mood === "sad" && <path d={`M${eyeX[1] + 5} ${fy + 6} q2.4 4 0 6.4 q-2.4 -2.4 0 -6.4 Z`} fill="#8fd3ff" />}
        {mood === "sleepy" && (
          <text className="c-zzz" x={fx + g.eye + 8} y={fy - 10} fontSize="13" fontWeight="800" fill="#fff" fontFamily="sans-serif">
            z
          </text>
        )}
      </g>
    </svg>
  );
}
