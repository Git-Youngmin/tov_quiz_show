import { BGM_ARTIST, BGM_CREDITS, BGM_LICENSE_URL } from "../audio/credits.ts";

/** 배경음악 출처 표기 (CC BY 4.0 조건). 진행 화면 아래쪽에 작게 */
export function MusicCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-center text-[11px] leading-relaxed text-mist/60 ${className}`}>
      ♪ {BGM_CREDITS.map((c) => `"${c.title}"`).join(" · ")} — {BGM_ARTIST} ·{" "}
      <a href={BGM_LICENSE_URL} target="_blank" rel="noreferrer" className="underline">
        CC BY 4.0
      </a>
    </p>
  );
}
