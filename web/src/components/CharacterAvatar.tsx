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

/** 로비에서 고르는 캐릭터 이름 */
export const SHAPE_LABEL: Record<CharacterShape, string> = {
  bear: "곰돌이",
  cat: "야옹이",
  rabbit: "토끼",
  puppy: "멍멍이",
  fox: "여우",
  panda: "팬더",
  frog: "개구리",
  penguin: "펭귄",
  chick: "병아리",
  monkey: "원숭이",
  pig: "돼지",
  koala: "코알라",
  hamster: "햄스터",
  tiger: "호랑이",
  lion: "사자",
  dino: "공룡",
  robot: "로봇",
  alien: "외계인",
  ghost: "유령",
  star: "별돌이",
  // 레거시 형태
  capsule: "캡슐",
  box: "상자",
  sphere: "구",
  cone: "원뿔",
};

export const SHAPE_NICK: Record<CharacterShape, string> = SHAPE_LABEL;

export const SHAPE_ICON: Record<CharacterShape, string> = {
  bear: "🐻",
  cat: "🐱",
  rabbit: "🐰",
  puppy: "🐶",
  fox: "🦊",
  panda: "🐼",
  frog: "🐸",
  penguin: "🐧",
  chick: "🐥",
  monkey: "🐵",
  pig: "🐷",
  koala: "🐨",
  hamster: "🐹",
  tiger: "🐯",
  lion: "🦁",
  dino: "🦖",
  robot: "🤖",
  alien: "👽",
  ghost: "👻",
  star: "⭐",
  capsule: "💊",
  box: "📦",
  sphere: "⚽",
  cone: "📐",
};

export type Mood = "idle" | "happy" | "cheer" | "sad" | "wave" | "sleepy";

const INK = "#1b2340";
const SNEAKER_WHITE = "#ffffff";
const SNEAKER_EDGE = "#cfd7ed";

/** 얼굴 위치/크기 기본값 */
interface Face {
  cx: number;
  ey: number; // 눈 y
  dx: number; // 눈 사이 반간격
  my: number; // 입 y
  by: number; // 볼터치 y
  bx: number; // 볼터치 x 오프셋
}

const DEFAULT_FACE: Face = { cx: 60, ey: 55, dx: 15, my: 71, by: 66, bx: 25 };

const FACE_OVERRIDE: Partial<Record<CharacterShape, Partial<Face>>> = {
  frog: { ey: 50, my: 73, dx: 17, by: 67 },
  chick: { ey: 54, my: 73, dx: 14, by: 65 },
  penguin: { ey: 54, my: 72, dx: 15, by: 66 },
  pig: { ey: 52, my: 77, dx: 16, by: 67 },
  cone: { ey: 66, my: 79, dx: 12.5, by: 76, bx: 20 },
  ghost: { ey: 55, my: 72, dx: 14, by: 66 },
  star: { ey: 58, my: 74, dx: 15, by: 68 },
};

function getFace(shape: CharacterShape): Face {
  return { ...DEFAULT_FACE, ...(FACE_OVERRIDE[shape] ?? {}) };
}

/** 문자열/숫자 → 0~1 (움직임 타이밍 분산용) */
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
  /** 움직임 타이밍 분산 시드 */
  seed?: string | number;
  /** 등장 시 팝업 애니메이션 */
  popIn?: boolean;
  /** 머리~가슴만 보여주기 (목록/버튼용) */
  bust?: boolean;
  className?: string;
}

/**
 * 팔다리가 있는 2D 움직이는 카훗 스타일 캐릭터 컴포넌트.
 * 각 캐릭터마다 고유의 귀, 부리, 뿔, 옷, 스니커즈 신발, 손가락이 있는 진짜 캐릭터입니다.
 */
export function CharacterAvatar({
  character,
  size = 56,
  mood = "idle",
  seed = 0,
  popIn = false,
  bust = false,
  className = "",
}: CharacterAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const { light, base, dark } = PALETTE[character.color] ?? PALETTE.blue;
  const shape = character.shape;
  const f = getFace(shape);
  const delay = `${-(hash01(seed) * 6).toFixed(2)}s`;
  const happy = mood === "happy" || mood === "cheer";
  const closedEyes = happy || mood === "sleepy";
  const id = (n: string) => `${n}${uid}`;
  const eyeX = [f.cx - f.dx, f.cx + f.dx];

  /** 머리 기본 베이스 형태 */
  const headShape = (fill: string): ReactElement => {
    switch (shape) {
      case "box":
        return <rect x="25" y="22" width="70" height="64" rx="18" fill={fill} />;
      case "cone":
        return <circle cx="60" cy="64" r="27" fill={fill} />;
      case "frog":
        return <ellipse cx="60" cy="58" rx="38" ry="32" fill={fill} />;
      case "star":
        return <circle cx="60" cy="58" r="34" fill={fill} />;
      default:
        // 통통하고 사랑스러운 둥근 두상
        return <ellipse cx="60" cy="55" rx="36" ry="33" fill={fill} />;
    }
  };

  /** 머리 뒤쪽 파츠 (귀, 뿔, 안테나 등) */
  const behind = (): ReactElement | null => {
    switch (shape) {
      case "bear":
        return (
          <g>
            <circle cx="30" cy="30" r="14" fill={base} stroke={dark} strokeWidth="2.5" />
            <circle cx="30" cy="30" r="8" fill="#ffe2cc" />
            <circle cx="90" cy="30" r="14" fill={base} stroke={dark} strokeWidth="2.5" />
            <circle cx="90" cy="30" r="8" fill="#ffe2cc" />
          </g>
        );
      case "cat":
        return (
          <g>
            <path d="M26 42 Q23 15 37 14 Q45 15 52 28 Z" fill={base} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M32 36 Q30 22 38 21 Q43 22 47 29 Z" fill="#ffb7c9" />
            <path d="M94 42 Q97 15 83 14 Q75 15 68 28 Z" fill={base} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M88 36 Q90 22 82 21 Q77 22 73 29 Z" fill="#ffb7c9" />
          </g>
        );
      case "rabbit":
        return (
          <g>
            <ellipse cx="44" cy="18" rx="10" ry="24" fill={base} stroke={dark} strokeWidth="2.5" transform="rotate(-8 44 18)" />
            <ellipse cx="44" cy="18" rx="5.5" ry="17" fill="#ffb7c9" transform="rotate(-8 44 18)" />
            <ellipse cx="76" cy="18" rx="10" ry="24" fill={base} stroke={dark} strokeWidth="2.5" transform="rotate(8 76 18)" />
            <ellipse cx="76" cy="18" rx="5.5" ry="17" fill="#ffb7c9" transform="rotate(8 76 18)" />
          </g>
        );
      case "puppy":
        return (
          <g>
            <path d="M26 36 C14 42 12 68 22 74 C30 78 36 66 32 46 Z" fill={dark} stroke="#0e172e" strokeWidth="2" />
            <path d="M94 36 C106 42 108 68 98 74 C90 78 84 66 88 46 Z" fill={dark} stroke="#0e172e" strokeWidth="2" />
          </g>
        );
      case "fox":
        return (
          <g>
            <path d="M22 40 Q18 12 36 10 Q45 12 50 26 Z" fill={base} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M28 34 Q26 18 36 17 Q41 18 45 26 Z" fill="#ffffff" />
            <path d="M98 40 Q102 12 84 10 Q75 12 70 26 Z" fill={base} stroke={dark} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M92 34 Q94 18 84 17 Q79 18 75 26 Z" fill="#ffffff" />
          </g>
        );
      case "panda":
        return (
          <g>
            <circle cx="30" cy="30" r="13" fill="#1b2340" stroke="#0c1020" strokeWidth="2" />
            <circle cx="90" cy="30" r="13" fill="#1b2340" stroke="#0c1020" strokeWidth="2" />
          </g>
        );
      case "frog":
        return (
          <g>
            <circle cx="40" cy="36" r="14" fill={base} stroke={dark} strokeWidth="2.5" />
            <circle cx="80" cy="36" r="14" fill={base} stroke={dark} strokeWidth="2.5" />
          </g>
        );
      case "chick":
        return (
          <g>
            <path d="M57 26 Q60 12 63 26" stroke="#ffa502" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="14" r="4.5" fill="#ffa502" />
          </g>
        );
      case "monkey":
        return (
          <g>
            <circle cx="21" cy="54" r="14" fill={base} stroke={dark} strokeWidth="2" />
            <circle cx="21" cy="54" r="8" fill="#ffd3b6" />
            <circle cx="99" cy="54" r="14" fill={base} stroke={dark} strokeWidth="2" />
            <circle cx="99" cy="54" r="8" fill="#ffd3b6" />
          </g>
        );
      case "pig":
        return (
          <g>
            <polygon points="26,38 18,20 38,24" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
            <polygon points="94,38 102,20 82,24" fill={light} stroke={dark} strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      case "koala":
        return (
          <g>
            <circle cx="22" cy="42" r="16" fill={base} stroke={dark} strokeWidth="2.5" />
            <circle cx="22" cy="42" r="9" fill="#ffffff" opacity="0.8" />
            <circle cx="98" cy="42" r="16" fill={base} stroke={dark} strokeWidth="2.5" />
            <circle cx="98" cy="42" r="9" fill="#ffffff" opacity="0.8" />
          </g>
        );
      case "hamster":
        return (
          <g>
            <circle cx="32" cy="32" r="10" fill={base} stroke={dark} strokeWidth="2" />
            <circle cx="32" cy="32" r="6" fill="#ffb7c9" />
            <circle cx="88" cy="32" r="10" fill={base} stroke={dark} strokeWidth="2" />
            <circle cx="88" cy="32" r="6" fill="#ffb7c9" />
          </g>
        );
      case "tiger":
        return (
          <g>
            <circle cx="31" cy="31" r="11" fill={base} stroke={dark} strokeWidth="2" />
            <circle cx="89" cy="31" r="11" fill={base} stroke={dark} strokeWidth="2" />
          </g>
        );
      case "lion":
        return (
          <g>
            {/* 풍성하고 사랑스러운 사자 갈기 */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x = 60 + Math.cos(rad) * 40;
              const y = 55 + Math.sin(rad) * 36;
              return <circle key={deg} cx={x} cy={y} r="14" fill="#e67e22" stroke="#d35400" strokeWidth="1.5" />;
            })}
          </g>
        );
      case "dino":
        return (
          <g>
            <polygon points="56,24 60,10 64,24" fill="#f5cd79" stroke="#d49b34" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="38,28 42,16 46,28" fill="#f5cd79" stroke="#d49b34" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="74,28 78,16 82,28" fill="#f5cd79" stroke="#d49b34" strokeWidth="2" strokeLinejoin="round" />
          </g>
        );
      case "robot":
        return (
          <g>
            <line x1="60" y1="24" x2="60" y2="6" stroke={dark} strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="5" r="5.5" fill="#00d2d3" stroke="#009798" strokeWidth="1.8" />
            <rect x="18" y="48" width="8" height="14" rx="3" fill={dark} />
            <rect x="94" y="48" width="8" height="14" rx="3" fill={dark} />
          </g>
        );
      case "alien":
        return (
          <g>
            <path d="M48 24 Q40 8 36 12" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
            <circle cx="36" cy="12" r="5" fill="#2ed573" />
            <path d="M72 24 Q80 8 84 12" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
            <circle cx="84" cy="12" r="5" fill="#2ed573" />
          </g>
        );
      case "star":
        return (
          <g>
            <polygon points="60,6 74,32 104,36 80,56 88,86 60,70 32,86 40,56 16,36 46,32" fill={base} stroke={dark} strokeWidth="3" strokeLinejoin="round" />
          </g>
        );
      case "capsule":
        return (
          <g fill="none" stroke={dark} strokeWidth="3.4" strokeLinecap="round">
            <path d="M60 17 C51 7 55 -3 66 1 C62 6 67 10 62 15" />
            <path d="M60 17 C69 9 78 11 76 3 C70 5 64 8 61 15" fill={light} stroke={dark} strokeWidth="2.2" strokeLinejoin="round" />
          </g>
        );
      default:
        return null;
    }
  };

  /** 머리 앞쪽 파츠 (주둥이, 코, 볼, 장식) */
  const front = (): ReactElement | null => {
    switch (shape) {
      case "bear":
        return (
          <g>
            <ellipse cx="60" cy="67" rx="14" ry="10" fill="#fff4e6" stroke={dark} strokeWidth="1.4" />
            <ellipse cx="60" cy="63" rx="5" ry="3.5" fill="#1b2340" />
          </g>
        );
      case "cat":
        return (
          <g>
            <polygon points="57,63 63,63 60,66" fill="#ff7597" />
            <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
              <line x1="28" y1="62" x2="16" y2="59" />
              <line x1="28" y1="67" x2="15" y2="68" />
              <line x1="92" y1="62" x2="104" y2="59" />
              <line x1="92" y1="67" x2="105" y2="68" />
            </g>
          </g>
        );
      case "rabbit":
        return (
          <g>
            <ellipse cx="60" cy="65" rx="3.8" ry="2.8" fill="#ff7597" />
            <rect x="57.5" y="71" width="5" height="5" rx="1.2" fill="#ffffff" stroke={INK} strokeWidth="1" />
          </g>
        );
      case "puppy":
        return (
          <g>
            <ellipse cx="60" cy="65" rx="13" ry="9" fill="#fff4e6" />
            <circle cx="60" cy="62" r="4.5" fill="#1b2340" />
            {happy && <path d="M57 73 Q60 82 63 73 Z" fill="#ff6b81" />}
          </g>
        );
      case "fox":
        return (
          <g>
            <path d="M30 65 Q45 74 60 74 Q75 74 90 65 Q75 58 60 62 Q45 58 30 65 Z" fill="#ffffff" />
            <polygon points="57,64 63,64 60,68" fill="#1b2340" />
          </g>
        );
      case "panda":
        return (
          <g>
            {/* 판다 눈 블랙 패치 */}
            <ellipse cx="44" cy="54" rx="12" ry="14" fill="#1b2340" transform="rotate(-15 44 54)" />
            <ellipse cx="76" cy="54" rx="12" ry="14" fill="#1b2340" transform="rotate(15 76 54)" />
            <ellipse cx="60" cy="66" rx="4" ry="2.8" fill="#1b2340" />
          </g>
        );
      case "penguin":
        return (
          <g>
            <polygon points="53,63 67,63 60,75" fill="#ffa502" stroke="#e07a1f" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        );
      case "chick":
        return (
          <g>
            <polygon points="54,64 66,64 60,73" fill="#ffa502" stroke="#e07a1f" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
        );
      case "pig":
        return (
          <g>
            <ellipse cx="60" cy="68" rx="12" ry="8" fill="#ffb7c9" stroke={dark} strokeWidth="1.5" />
            <circle cx="56" cy="68" r="2" fill="#7a2338" />
            <circle cx="64" cy="68" r="2" fill="#7a2338" />
          </g>
        );
      case "monkey":
        return (
          <g>
            <ellipse cx="60" cy="67" rx="18" ry="12" fill="#ffd3b6" stroke={dark} strokeWidth="1.2" />
            <circle cx="57" cy="65" r="1.5" fill="#1b2340" />
            <circle cx="63" cy="65" r="1.5" fill="#1b2340" />
          </g>
        );
      case "koala":
        return (
          <g>
            <ellipse cx="60" cy="64" rx="8" ry="12" fill="#1b2340" />
          </g>
        );
      case "hamster":
        return (
          <g>
            <circle cx="38" cy="66" r="11" fill="#ffffff" opacity="0.9" />
            <circle cx="82" cy="66" r="11" fill="#ffffff" opacity="0.9" />
            <polygon points="58,64 62,64 60,67" fill="#ff7597" />
            <rect x="58.5" y="70" width="3" height="4" rx="0.8" fill="#ffffff" stroke={INK} strokeWidth="0.8" />
          </g>
        );
      case "tiger":
        return (
          <g>
            <path d="M53 28 L60 35 L67 28" fill="none" stroke="#1b2340" strokeWidth="3" strokeLinecap="round" />
            <line x1="55" y1="38" x2="65" y2="38" stroke="#1b2340" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="60" cy="65" rx="4" ry="2.5" fill="#1b2340" />
          </g>
        );
      case "alien":
        return (
          <g>
            {/* 제3의 눈 */}
            <circle cx="60" cy="38" r="7.5" fill="#ffffff" stroke={dark} strokeWidth="1.5" />
            <circle cx="60" cy="38" r="4" fill="#1b2340" />
            <circle cx="58.5" cy="36.5" r="1.5" fill="#ffffff" />
          </g>
        );
      case "robot":
        return (
          <g>
            <rect x="33" y="36" width="54" height="42" rx="12" fill={`url(#${id("p")})`} stroke={dark} strokeWidth="1.4" />
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
      default:
        return null;
    }
  };

  /** 몸통 렌더링 */
  const torso = (): ReactElement => {
    return (
      <g>
        {/* 상의 / 옷 / 몸통 */}
        <rect x="41" y="82" width="38" height="38" rx="12" fill={`url(#${id("t")})`} />
        {/* 배 패치 또는 옷 디테일 */}
        {shape === "penguin" ? (
          <ellipse cx="60" cy="102" rx="13" ry="14" fill="#ffffff" />
        ) : shape === "panda" ? (
          <ellipse cx="60" cy="102" rx="12" ry="13" fill="#ffffff" />
        ) : shape === "frog" ? (
          <ellipse cx="60" cy="102" rx="12" ry="13" fill="#e8ffaa" />
        ) : shape === "robot" ? (
          <g>
            <rect x="49" y="93" width="22" height="15" rx="4" fill="#1b2340" />
            <circle cx="55" cy="100.5" r="2.2" fill="#00d2d3" />
            <circle cx="65" cy="100.5" r="2.2" fill="#ff4757" />
          </g>
        ) : (
          <g>
            {/* 귀여운 후디/티셔츠 넥라인 & 가슴 하이라이트 */}
            <path d="M50 82 Q60 90 70 82" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
            <ellipse cx="60" cy="102" rx="9" ry="10" fill="#ffffff" opacity="0.25" />
          </g>
        )}
      </g>
    );
  };

  const limbColor = dark;
  const { cx } = f;

  const viewBox = bust ? "14 -6 92 106" : "0 -6 120 166";
  const height = bust ? (size * 106) / 92 : (size * 166) / 120;

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={height}
      role="img"
      aria-label={`${COLOR_LABEL[character.color]} ${SHAPE_LABEL[shape]} 캐릭터`}
      className={`tob-char ${bust ? "tob-bust" : ""} ${popIn ? "animate-pop" : ""} ${className}`}
      data-mood={mood}
      style={{ "--d": delay } as CSSProperties}
    >
      <defs>
        <radialGradient id={id("h")} cx="35%" cy="25%" r="95%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={base} />
          <stop offset="1" stopColor={dark} />
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
          <stop offset="0.6" stopColor={INK} />
          <stop offset="1" stopColor="#0d1226" />
        </radialGradient>
        <radialGradient id={id("s")}>
          <stop offset="0" stopColor="#020611" stopOpacity="0.75" />
          <stop offset="1" stopColor="#020611" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id("c")}>{headShape("#000")}</clipPath>
      </defs>

      {/* 바닥 그림자 */}
      <ellipse className="c-shadow" cx="60" cy="148" rx="32" ry="7" fill={`url(#${id("s")})`} />

      <g className="c-body">
        {/* 다리 + 스니커즈 신발 (진짜 캐릭터 같은 도톰한 다리와 신발) */}
        <g className="c-leg-l">
          {/* 다리 기둥 */}
          <rect x="47" y="112" width="10" height="24" rx="5" fill={limbColor} />
          {/* 스니커즈 본체 */}
          <path d="M42 135 L59 135 C61 135 62 137 62 140 L62 144 L38 144 C38 139 39 135 42 135 Z" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1" />
          {/* 토캡 포인트 (캐릭터 컬러 포인트) */}
          <path d="M38 141 Q40 136 45 136 L45 144 L38 144 Z" fill={base} />
          {/* 신발 밑창 */}
          <rect x="37" y="143" width="26" height="4.5" rx="2" fill="#2d3436" />
        </g>
        <g className="c-leg-r">
          {/* 다리 기둥 */}
          <rect x="63" y="112" width="10" height="24" rx="5" fill={limbColor} />
          {/* 스니커즈 본체 */}
          <path d="M78 135 L61 135 C59 135 58 137 58 140 L58 144 L82 144 C82 139 81 135 78 135 Z" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1" />
          {/* 토캡 포인트 (캐릭터 컬러 포인트) */}
          <path d="M82 141 Q80 136 75 136 L75 144 L82 144 Z" fill={base} />
          {/* 신발 밑창 */}
          <rect x="57" y="143" width="26" height="4.5" rx="2" fill="#2d3436" />
        </g>

        {torso()}

        {/* 머리 (고개 갸웃거림 & 표정) */}
        <g className="c-head">
          {behind()}
          {headShape(`url(#${id("h")})`)}

          {/* 머리 입체 하이라이트 */}
          <g clipPath={`url(#${id("c")})`}>
            <ellipse className="c-static" cx="44" cy="35" rx="16" ry="10" fill="#ffffff" opacity="0.32" transform="rotate(-24 44 35)" />
            <ellipse cx="66" cy="94" rx="46" ry="16" fill={dark} opacity="0.22" />
          </g>

          {front()}

          {/* 사랑스러운 볼터치 */}
          <ellipse cx={cx - f.bx} cy={f.by} rx="6" ry="4" fill="#ff7a9a" opacity="0.6" />
          <ellipse cx={cx + f.bx} cy={f.by} rx="6" ry="4" fill="#ff7a9a" opacity="0.6" />

          {/* 눈썹 */}
          {!happy && mood !== "sleepy" && (
            <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" opacity="0.85">
              {eyeX.map((x, i) => {
                const s = i === 0 ? 1 : -1;
                return mood === "sad" ? (
                  <path key={x} d={`M${x - 6 * s} ${f.ey - 13} L${x + 6 * s} ${f.ey - 17}`} />
                ) : (
                  <path key={x} d={`M${x - 6} ${f.ey - 14} Q${x} ${f.ey - 18} ${x + 6} ${f.ey - 14}`} />
                );
              })}
            </g>
          )}

          {/* 눈: 초롱초롱 반짝이는 카훗 만화 눈 */}
          {closedEyes ? (
            <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round">
              {eyeX.map((x) =>
                happy ? (
                  <path key={x} d={`M${x - 7.5} ${f.ey + 2} Q${x} ${f.ey - 9} ${x + 7.5} ${f.ey + 2}`} />
                ) : (
                  <path key={x} d={`M${x - 7.5} ${f.ey - 1} Q${x} ${f.ey + 6} ${x + 7.5} ${f.ey - 1}`} />
                ),
              )}
            </g>
          ) : (
            <g className="c-eyes">
              <g className="c-pupils">
                {eyeX.map((x) => (
                  <g key={x}>
                    {/* 흰자위 */}
                    <ellipse cx={x} cy={f.ey} rx="8.5" ry="11" fill="#ffffff" />
                    {/* 눈동자 */}
                    <ellipse cx={x} cy={f.ey} rx="7.4" ry="9.8" fill={`url(#${id("e")})`} />
                    {/* 트윈 하이라이트 글린트 */}
                    <circle cx={x - 2.8} cy={f.ey - 3.8} r="3.2" fill="#ffffff" />
                    <circle cx={x + 2.8} cy={f.ey + 3.4} r="1.5" fill="#ffffff" opacity="0.9" />
                  </g>
                ))}
              </g>
            </g>
          )}

          {/* 입 (귀여운 입모양) */}
          {happy ? (
            <g>
              <path d={`M${cx - 8} ${f.my - 2} Q${cx} ${f.my + 14} ${cx + 8} ${f.my - 2} Z`} fill="#7a2338" />
              <ellipse cx={cx} cy={f.my + 5} rx="4" ry="2.5" fill="#ff8aa6" />
            </g>
          ) : mood === "sad" ? (
            <path d={`M${cx - 6} ${f.my + 4} Q${cx} ${f.my - 2} ${cx + 6} ${f.my + 4}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          ) : mood === "sleepy" ? (
            <ellipse cx={cx} cy={f.my + 1} rx="3" ry="2.5" fill="#7a2338" />
          ) : (
            <path
              d={`M${cx - 6} ${f.my} Q${cx - 3} ${f.my + 5} ${cx} ${f.my + 1} Q${cx + 3} ${f.my + 5} ${cx + 6} ${f.my}`}
              fill="none"
              stroke={INK}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {mood === "sad" && <path d={`M${eyeX[1] + 7} ${f.ey + 6} q3 5 0 8 q-3 -3 0 -8 Z`} fill="#8fd3ff" />}
          {mood === "sleepy" && (
            <text className="c-zzz" x={cx + f.dx + 14} y={f.ey - 16} fontSize="16" fontWeight="900" fill="#fff" fontFamily="sans-serif">
              z
            </text>
          )}
        </g>

        {/* 팔 + 손가락 장갑 (진짜 캐릭터 같은 도톰하고 활동적인 팔) */}
        <g className="c-arm-l">
          {/* 팔뚝 */}
          <path d="M44 88 Q32 102 30 114" fill="none" stroke={limbColor} strokeWidth="9" strokeLinecap="round" />
          {/* 손 & 엄지손가락 */}
          <circle cx="28" cy="116" r="8" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1.2" />
          <circle cx="34" cy="113" r="3.5" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1.2" />
        </g>
        <g className="c-arm-r">
          {/* 팔뚝 */}
          <path d="M76 88 Q88 102 90 114" fill="none" stroke={limbColor} strokeWidth="9" strokeLinecap="round" />
          {/* 손 & 엄지손가락 */}
          <circle cx="92" cy="116" r="8" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1.2" />
          <circle cx="86" cy="113" r="3.5" fill={SNEAKER_WHITE} stroke={SNEAKER_EDGE} strokeWidth="1.2" />
        </g>
      </g>
    </svg>
  );
}
