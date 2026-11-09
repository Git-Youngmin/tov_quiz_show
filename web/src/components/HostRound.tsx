import { useEffect, useState } from "react";
import { choiceCountOf, type AnswerIndex } from "@tob/shared";
import { sound } from "../audio/ClassicalBgmEngine.ts";
import { useServerNow } from "../lib/useCountdown.ts";
import type { RoomView } from "../lib/useRoom.ts";
import { AnimatedScoreboard } from "./AnimatedScoreboard.tsx";
import { AnswerButton, ANSWER_STYLES, OX_STYLES } from "./AnswerButton.tsx";
import { QuestionIntro, TYPE_LABEL } from "./QuestionIntro.tsx";

type HostQuestionMsg = NonNullable<RoomView["hostQuestion"]>;
type ResultMsg = NonNullable<RoomView["result"]>;

const typePill = (type: "ox" | "choice") =>
  type === "ox" ? "bg-blue-500/30 text-blue-100 ring-1 ring-blue-300/40" : "bg-gold-400/25 text-gold-100 ring-1 ring-gold-300/40";

/**
 * 문제 화면 (진행 화면).
 * 맨 앞에 "O/X 퀴즈!" 소개와 3-2-1 카운트다운이 나오고, 끝나면 제한 시간 막이 줄어들기 시작한다.
 * O/X 문제는 선택지가 2개뿐이라 버튼을 작게 두고 문제 글에 공간을 더 준다.
 */
export function HostQuestion({
  q,
  total,
  answered,
  connected,
  onSkip,
}: {
  q: HostQuestionMsg;
  total: number;
  answered: number;
  connected: number;
  onSkip: () => void;
}) {
  const type = q.question.type;
  const now = useServerNow(100);
  const started = now >= q.startsAt;
  const limitMs = q.question.timeLimitSec * 1000;
  const msLeft = Math.max(0, q.endsAt - now);
  const left = Math.min(q.question.timeLimitSec, Math.ceil(msLeft / 1000));
  const pct = started ? Math.min(100, (msLeft / limitMs) * 100) : 100;
  const urgent = started && left <= 3;

  useEffect(() => {
    if (started && left <= 5 && left > 0) sound.playTick();
  }, [started, left]);

  return (
    <section className="flex flex-1 flex-col gap-5 p-6 sm:p-8">
      <QuestionIntro startsAt={q.startsAt} number={q.index + 1} total={total} type={type} />

      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-navy-600 px-4 py-1 text-lg font-bold">
          {q.index + 1} / {total}
        </span>
        <span className={`rounded-full px-4 py-1 text-lg font-bold ${typePill(type)}`}>{TYPE_LABEL[type]}</span>
        <span className="ml-auto text-2xl font-bold">
          응답 {answered} / {connected}
        </span>
      </div>

      {type === "ox" ? (
        <h2 className="grid flex-1 place-items-center rounded-3xl bg-white p-8 text-center text-4xl leading-snug font-bold text-navy-950 sm:text-6xl">
          {q.question.text}
        </h2>
      ) : (
        <h2 className="rounded-3xl bg-white p-8 text-center text-4xl font-bold text-navy-950 sm:text-5xl">{q.question.text}</h2>
      )}

      <div className="flex items-center gap-4">
        <span className={`grid size-20 shrink-0 place-items-center rounded-full text-5xl font-black ${urgent ? "bg-red-500" : "bg-navy-600"} transition-colors`}>
          {left}
        </span>
        <div className="h-5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={`time-bar h-full rounded-full ${urgent ? "bg-red-400" : "bg-gold-400"}`} style={{ width: `${pct}%` }} />
        </div>
        <button onClick={onSkip} disabled={!started} className="rounded-xl bg-white/10 px-4 py-2 text-lg disabled:opacity-40">
          마감하기
        </button>
      </div>

      {type === "ox" ? (
        <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-6">
          {([0, 1] as const).map((i) => (
            <AnswerButton key={i} kind="ox" index={i} disabled className="h-36 sm:h-44" />
          ))}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-4">
          {q.question.choices.slice(0, choiceCountOf(type)).map((c, i) => (
            <AnswerButton key={i} kind="choice" index={i as AnswerIndex} disabled>
              {c}
            </AnswerButton>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * 문제가 끝난 뒤의 연출:  "결과 발표!" → 정답 공개(보기별 인원 막대) → 점수판 애니메이션.
 * 앞의 두 단계는 자동으로 넘어가고, 진행자는 단계마다 버튼으로 앞당길 수 있다.
 */
export function RoundResult({
  q,
  result,
  isLast,
  onNext,
}: {
  q: HostQuestionMsg;
  result: ResultMsg;
  isLast: boolean;
  onNext: () => void;
}) {
  const type = q.question.type;
  const [stage, setStage] = useState<"flash" | "answer" | "board">("flash");

  useEffect(() => {
    setStage("flash");
    const t1 = setTimeout(() => setStage("answer"), 1000);
    const t2 = setTimeout(() => setStage("board"), 1000 + 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [result]);

  if (stage === "flash") {
    return (
      <section className="grid flex-1 place-items-center p-8">
        <p className="flash-title font-serif-kr text-center text-6xl font-black text-gold-200 sm:text-8xl">🥁 결과 발표!</p>
      </section>
    );
  }

  if (stage === "answer") {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6 sm:p-8">
        <div className="my-auto flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-4 py-1 text-lg font-bold ${typePill(type)}`}>{TYPE_LABEL[type]}</span>
            <span className="text-lg text-mist">{q.index + 1}번 문제의 정답은?</span>
          </div>
          <h2 className="rounded-3xl bg-white/95 p-8 text-center text-3xl leading-snug font-bold text-navy-950 sm:text-5xl">{q.question.text}</h2>
          <AnswerTiles q={q} result={result} />
        </div>
        <div className="flex justify-end">
          <button onClick={() => setStage("board")} className="btn-gold rounded-2xl px-8 py-4 text-2xl font-black">
            점수판 ▶
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif-kr text-4xl font-extrabold">🏅 점수판</h2>
        <button onClick={onNext} className="btn-gold rounded-2xl px-8 py-4 text-2xl font-black">
          {isLast ? "최종 결과 ▶" : "다음 문제 ▶"}
        </button>
      </div>
      <AnimatedScoreboard entries={result.board} />
    </section>
  );
}

/** 보기별로 몇 명이 골랐는지 막대로 보여 주고, 정답은 반짝이게 */
function AnswerTiles({ q, result }: { q: HostQuestionMsg; result: ResultMsg }) {
  const type = q.question.type;
  const count = choiceCountOf(type);
  const max = Math.max(1, ...result.distribution.slice(0, count));
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrow(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`grid gap-4 ${type === "ox" ? "mx-auto w-full max-w-3xl grid-cols-2 gap-6" : "grid-cols-2"}`}>
      {Array.from({ length: count }, (_, i) => {
        const style = type === "ox" ? OX_STYLES[i as 0 | 1] : ANSWER_STYLES[i];
        const correct = i === result.answerIndex;
        const n = result.distribution[i];
        return (
          <div
            key={i}
            className={`${style.bg} relative overflow-hidden rounded-2xl p-4 text-white shadow-[0_6px_0_rgba(0,0,0,0.25)] transition ${
              correct ? "scale-[1.04] ring-4 ring-white" : "opacity-40"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className={`${type === "ox" ? "text-6xl" : "text-4xl"} font-black drop-shadow`} aria-hidden>
                {style.icon}
              </span>
              {type === "choice" && <span className="flex-1 text-xl font-bold sm:text-2xl">{q.question.choices[i]}</span>}
              {type === "ox" && <span className="flex-1" />}
              <span className="text-right">
                <span className="block text-4xl font-black tabular-nums">{n}</span>
                <span className="text-sm opacity-80">명</span>
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/25">
              <div
                className="h-full rounded-full bg-white/90"
                style={{ width: grow ? `${(n / max) * 100}%` : "0%", transition: "width 1s cubic-bezier(0.2, 0.9, 0.3, 1)" }}
              />
            </div>
            {correct && <span className="gain-badge absolute -top-0.5 left-4 rounded-b-lg bg-white px-3 py-0.5 text-sm font-black text-navy-950">✓ 정답</span>}
          </div>
        );
      })}
    </div>
  );
}
