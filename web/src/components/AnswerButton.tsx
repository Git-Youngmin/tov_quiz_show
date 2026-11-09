import type { AnswerIndex } from "@tob/shared";
import type { ReactNode } from "react";

/** 보기 1~4 = 빨강▲ / 파랑◆ / 노랑● / 초록■ */
export const ANSWER_STYLES = [
  { bg: "bg-red-500", icon: "▲", label: "빨강" },
  { bg: "bg-blue-500", icon: "◆", label: "파랑" },
  { bg: "bg-yellow-400", icon: "●", label: "노랑" },
  { bg: "bg-green-500", icon: "■", label: "초록" },
] as const;

/** O/X 문제: 0 = O(파랑), 1 = X(빨강) */
export const OX_STYLES = [
  { bg: "bg-blue-500", icon: "O", label: "O" },
  { bg: "bg-red-500", icon: "X", label: "X" },
] as const;

export function AnswerButton({
  kind = "choice",
  index,
  onClick,
  disabled,
  dimmed,
  className = "",
  children,
}: {
  kind?: "choice" | "ox";
  index: AnswerIndex;
  onClick?: () => void;
  disabled?: boolean;
  dimmed?: boolean;
  /** 크기/모양을 화면마다 다르게 하고 싶을 때 (예: O/X 를 정사각형으로) */
  className?: string;
  children?: ReactNode;
}) {
  const s = kind === "ox" ? OX_STYLES[index as 0 | 1] : ANSWER_STYLES[index];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={kind === "ox" ? s.label : `${index + 1}번 ${s.label}`}
      className={`${s.bg} flex items-center gap-4 ${children ? "" : "justify-center"} rounded-2xl p-4 text-left font-bold text-white shadow-[0_6px_0_rgba(0,0,0,0.25)] transition active:translate-y-1 active:shadow-none disabled:cursor-default ${
        dimmed ? "opacity-30" : ""
      } ${className}`}
    >
      <span className={`drop-shadow ${children ? "text-4xl" : "text-7xl"}`} aria-hidden>
        {s.icon}
      </span>
      {children && <span className="text-xl sm:text-2xl">{children}</span>}
    </button>
  );
}
