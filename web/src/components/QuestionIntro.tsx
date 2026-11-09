import { useEffect } from "react";
import type { QuestionType } from "@tob/shared";
import { sound } from "../audio/ClassicalBgmEngine.ts";
import { useServerNow } from "../lib/useCountdown.ts";
import { ANSWER_STYLES, OX_STYLES } from "./AnswerButton.tsx";

export const TYPE_LABEL: Record<QuestionType, string> = { ox: "O/X 퀴즈", choice: "4지선다 퀴즈" };

/**
 * 문제가 나오기 직전의 소개 + 카운트다운 화면 (진행 화면과 폰에서 같은 시각에 같이 흘러간다).
 *   앞 1초: "O/X 퀴즈!" / "4지선다 퀴즈!" 로 어떤 문제인지 알려 줌
 *   뒤 3초: 3 → 2 → 1 (숫자마다 쾅 하고 나타나며 파동이 퍼짐)
 * startsAt(서버 시각)이 지나면 저절로 사라진다.
 */
export function QuestionIntro({
  startsAt,
  number,
  total,
  type,
}: {
  startsAt: number;
  number: number;
  total: number;
  type: QuestionType;
}) {
  const now = useServerNow(80);
  const remaining = startsAt - now;
  const showType = remaining > 3000;
  const count = remaining > 0 ? Math.min(3, Math.ceil(remaining / 1000)) : 0;

  // 3, 2, 1 이 바뀔 때마다 똑딱
  useEffect(() => {
    if (!showType && count > 0) sound.playTick();
  }, [showType, count]);

  if (remaining <= 0) return null;

  return (
    <div className="intro" role="status" aria-live="polite" aria-label={showType ? `${TYPE_LABEL[type]} ${number}번 문제` : `${count}`}>
      <div className="intro__rays" aria-hidden />
      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        <p className="font-serif-kr text-xl tracking-[0.3em] text-gold-200 sm:text-3xl">
          QUESTION {number} / {total}
        </p>

        {showType ? (
          <div key="type" className="intro__card flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              {type === "ox"
                ? OX_STYLES.map((s, i) => (
                    <span
                      key={s.label}
                      className={`intro__glyph grid size-24 place-items-center rounded-3xl text-6xl font-black text-white shadow-[0_8px_0_rgba(0,0,0,0.3)] sm:size-36 sm:text-8xl ${s.bg}`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      {s.icon}
                    </span>
                  ))
                : ANSWER_STYLES.map((s, i) => (
                    <span
                      key={s.label}
                      className={`intro__glyph grid size-16 place-items-center rounded-2xl text-4xl text-white shadow-[0_6px_0_rgba(0,0,0,0.3)] sm:size-28 sm:text-6xl ${s.bg}`}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {s.icon}
                    </span>
                  ))}
            </div>
            <p className="font-serif-kr text-5xl font-extrabold sm:text-7xl">{TYPE_LABEL[type]}!</p>
            <p className="text-lg text-mist sm:text-2xl">{type === "ox" ? "맞으면 O, 틀리면 X 를 눌러요" : "알맞은 정답을 하나 골라요"}</p>
          </div>
        ) : (
          <div key={count} className="relative grid place-items-center">
            <span className="intro__ring" aria-hidden />
            <span className="intro__num text-[9rem] text-gold-200 sm:text-[15rem]">{count}</span>
          </div>
        )}

        {!showType && <span className="rounded-full bg-white/10 px-5 py-1.5 text-base font-bold text-mist sm:text-xl">{TYPE_LABEL[type]}</span>}
      </div>
    </div>
  );
}
