import type { AnswerIndex, QuestionInput, QuizInput } from "./protocol.ts";

export const QUIZ_LIMITS = {
  titleMax: 50,
  questionsMax: 50,
  textMax: 200,
  choiceMax: 80,
  timeMin: 5,
  timeMax: 120,
  /** 새 문제의 기본 제한 시간(초) — O/X · 4지선다 공통 */
  timeDefault: 10,
  /** 편집 화면 슬라이더 범위(초). 저장 가능 범위(timeMin~timeMax)는 더 넓다 */
  timeSliderMin: 10,
  timeSliderMax: 20,
} as const;

export type ValidationResult = { ok: true; value: QuizInput } | { ok: false; error: string };

/** 클라이언트(저장 전 점검)와 서버(저장 시 검증)가 같은 규칙을 쓴다. 문자열은 trim 해서 돌려준다. */
export function validateQuizInput(v: unknown): ValidationResult {
  const L = QUIZ_LIMITS;
  if (!v || typeof v !== "object") return { ok: false, error: "잘못된 요청이에요" };
  const { title, questions } = v as Record<string, unknown>;

  const t = typeof title === "string" ? title.trim() : "";
  if (!t) return { ok: false, error: "퀴즈 제목을 입력해 주세요" };
  if (t.length > L.titleMax) return { ok: false, error: `제목은 ${L.titleMax}자까지예요` };
  if (!Array.isArray(questions) || questions.length === 0) return { ok: false, error: "문제를 1개 이상 추가해 주세요" };
  if (questions.length > L.questionsMax) return { ok: false, error: `문제는 ${L.questionsMax}개까지예요` };

  const out: QuestionInput[] = [];
  for (let i = 0; i < questions.length; i++) {
    const n = i + 1;
    const q = questions[i] as Record<string, unknown> | null;
    const type = q?.type === "ox" ? "ox" : "choice";
    const text = typeof q?.text === "string" ? q.text.trim() : "";
    if (!text) return { ok: false, error: `${n}번 문제 내용을 입력해 주세요` };
    if (text.length > L.textMax) return { ok: false, error: `${n}번 문제는 ${L.textMax}자까지예요` };

    let choices: string[];
    if (type === "ox") {
      choices = ["O", "X", "", ""]; // O/X 는 보기 글자가 고정
    } else {
      const rawChoices = q?.choices;
      if (!Array.isArray(rawChoices) || rawChoices.length !== 4) return { ok: false, error: `${n}번 문제의 보기는 4개여야 해요` };
      choices = rawChoices.map((c) => (typeof c === "string" ? c.trim() : ""));
      const empty = choices.findIndex((c) => !c);
      if (empty >= 0) return { ok: false, error: `${n}번 문제 ${empty + 1}번 보기를 입력해 주세요` };
      if (choices.some((c) => c.length > L.choiceMax)) return { ok: false, error: `${n}번 문제 보기는 ${L.choiceMax}자까지예요` };
    }

    const answerIndex = q?.answerIndex;
    const maxIndex = type === "ox" ? 1 : 3;
    if (typeof answerIndex !== "number" || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > maxIndex) {
      return { ok: false, error: `${n}번 문제의 정답을 골라 주세요` };
    }
    const time = q?.timeLimitSec;
    if (typeof time !== "number" || !Number.isInteger(time) || time < L.timeMin || time > L.timeMax) {
      return { ok: false, error: `${n}번 문제의 제한 시간은 ${L.timeMin}~${L.timeMax}초예요` };
    }
    out.push({
      type,
      text,
      choices: choices as QuestionInput["choices"],
      answerIndex: answerIndex as AnswerIndex,
      timeLimitSec: time,
    });
  }
  return { ok: true, value: { title: t, questions: out } };
}
