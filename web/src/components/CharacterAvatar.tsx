import type { Character, CharacterColor, CharacterShape } from "@tob/shared";

export const COLOR_HEX: Record<CharacterColor, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
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

/** 2D 미리보기용 캐릭터 (도형 + 눈). 추후 3D/일러스트로 교체 가능 */
export function CharacterAvatar({ character, size = 56 }: { character: Character; size?: number }) {
  const fill = COLOR_HEX[character.color];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label={`${COLOR_LABEL[character.color]} ${SHAPE_LABEL[character.shape]}`}>
      {character.shape === "capsule" && <rect x="16" y="4" width="32" height="56" rx="16" fill={fill} />}
      {character.shape === "box" && <rect x="10" y="10" width="44" height="44" rx="6" fill={fill} />}
      {character.shape === "sphere" && <circle cx="32" cy="32" r="24" fill={fill} />}
      {character.shape === "cone" && <path d="M32 4 L56 58 Q32 64 8 58 Z" fill={fill} strokeLinejoin="round" />}
      <circle cx="25" cy="30" r="5" fill="white" />
      <circle cx="39" cy="30" r="5" fill="white" />
      <circle cx="26" cy="31" r="2.2" fill="#1f2937" />
      <circle cx="40" cy="31" r="2.2" fill="#1f2937" />
    </svg>
  );
}
