import type { AnswerIndex, QuestionInput } from "./protocol.ts";
import { QUIZ_LIMITS } from "./validate.ts";

export interface ParseResult {
  questions: QuestionInput[];
  /** 건너뛴 문제나 확인이 필요한 부분 ("3번: 정답을 찾지 못했어요" 형태) */
  warnings: string[];
}

/**
 * 단톡방에 올리던 퀴즈 글을 문제 목록으로 바꾼다. 지원하는 형태:
 *   - 번호:      `1. 문제`  /  `1) 문제`
 *   - O/X:       보기 없이 `정답: O` / `답 : X` (문제 끝의 `(O / X)` 표시는 제거)
 *   - 4지선다:   보기 `① ② ③ ④` 또는 `A. B. C. D.`
 *   - 정답 표기: `정답: 3` · `답 : ③` · `정답: C` · `정답: (O)` · `정답: ③ 보기 글 그대로`
 *                문제 끝에 붙은 `? 3`, O/X 문제 끝의 `(O)` · `( X )`
 *   - 문제가 여러 줄이어도 보기 전까지는 이어 붙임. 퀴즈 앞뒤의 인사말은 무시.
 */
export function parseQuizText(raw: string): ParseResult {
  const questions: QuestionInput[] = [];
  const warnings: string[] = [];

  type Answer = { kind: "ox" | "idx"; index: number };
  interface Cur {
    num: number;
    text: string;
    oxHint: boolean;
    choices: string[];
    answer: Answer | null;
  }
  let cur: Cur | null = null;

  const CIRCLED = "①②③④";
  const Q_START = /^(\d{1,3})\s*[.)．]\s*(.+)$/;
  const CHOICE_CIRCLED = /^([①②③④])\s*(.*)$/;
  const CHOICE_LETTER = /^([A-Da-d])\s*[.)]\s*(.*)$/;
  const ANSWER_LINE = /^(?:정답|답)\s*[:：]\s*(.+)$/;
  const ANSWER_BARE = /^(?:정답|답)\s+([OoXx○×✕❌1-4①-④A-Da-d]번?)\s*$/;
  const OX_HINT = /\s*[(（]\s*[Oo○]\s*[/／]\s*[Xx×]\s*[)）]\s*/;
  /** 문제 끝의 "(O / X)" 표시를 떼고 있었는지 함께 알려 준다 */
  const stripOx = (t: string) => ({ text: t.replace(OX_HINT, " ").trim(), hint: OX_HINT.test(t) });
  const INLINE_ANSWER = /^(.*[?？])\s*([1-4①②③④])\s*$/;
  /** O/X 문제 끝에 정답이 괄호로 붙은 형태: "…이다. (O)" */
  const INLINE_OX_ANSWER = /^(.*?)\s*[(（]\s*([OoXx○×])\s*[)）]\s*$/;
  /** "③ 죽은 믿음" 처럼 정답 뒤에 글이 이어질 때 맨 앞 기호만 */
  const LEADING_TOKEN = /^([①②③④]|[1-4]번?|[A-Da-d]|[OoXx○×])(?=\s|$|[.)])/;

  const parseToken = (tokenRaw: string): Answer | null => {
    const t = tokenRaw.trim().replace(/^[(（[]\s*/, "").replace(/\s*[)）\]]$/, "").replace(/[.。]$/, "");
    if (/^[Oo○⭕]$/.test(t)) return { kind: "ox", index: 0 };
    if (/^[Xx×✕✗❌]$/.test(t)) return { kind: "ox", index: 1 };
    const digit = t.match(/^([1-4])번?$/);
    if (digit) return { kind: "idx", index: Number(digit[1]) - 1 };
    if (t.length === 1 && CIRCLED.includes(t)) return { kind: "idx", index: CIRCLED.indexOf(t) };
    if (/^[A-Da-d]$/.test(t)) return { kind: "idx", index: t.toUpperCase().charCodeAt(0) - 65 };
    return null;
  };

  const flush = () => {
    if (!cur) return;
    const d = cur;
    cur = null;
    const warn = (msg: string) => warnings.push(`${d.num}번: ${msg}`);
    const text = d.text.trim();
    if (!text) return warn("문제 내용이 비어 있어요");
    if (!d.answer) return warn("정답을 찾지 못해서 건너뛰었어요");

    if (d.choices.length === 0) {
      if (!(d.oxHint || d.answer.kind === "ox")) return warn("보기도 O/X 표시도 없어서 건너뛰었어요");
      if (d.answer.index > 1) return warn("O/X 문제의 정답이 O 나 X 가 아니라서 건너뛰었어요");
      questions.push({
        type: "ox",
        text,
        choices: ["O", "X", "", ""],
        answerIndex: d.answer.index as AnswerIndex,
        timeLimitSec: QUIZ_LIMITS.timeDefaultOx,
      });
      return;
    }
    if (d.choices.length !== 4) return warn(`보기가 ${d.choices.length}개예요 (4개여야 해요). 건너뛰었어요`);
    if (d.answer.kind === "ox") return warn("보기가 있는 문제인데 정답이 O/X 로 적혀 있어서 건너뛰었어요");
    questions.push({
      type: "choice",
      text,
      choices: d.choices as QuestionInput["choices"],
      answerIndex: d.answer.index as AnswerIndex,
      timeLimitSec: QUIZ_LIMITS.timeDefault,
    });
  };

  const lines = raw.replace(/\r/g, "").replace(/[​﻿]/g, "").split("\n");
  for (const line of lines.map((l) => l.trim())) {
    if (!line) continue;

    const ans = line.match(ANSWER_LINE) ?? line.match(ANSWER_BARE);
    if (ans && cur) {
      const a = parseToken(ans[1]) ?? parseToken(ans[1].match(LEADING_TOKEN)?.[1] ?? "");
      if (a) cur.answer = a;
      else warnings.push(`${cur.num}번: 정답 표기 "${ans[1]}" 를 이해하지 못했어요`);
      continue;
    }

    const choice = line.match(CHOICE_CIRCLED) ?? line.match(CHOICE_LETTER);
    if (choice && cur) {
      cur.choices.push(choice[2].trim());
      continue;
    }

    const start = line.match(Q_START);
    if (start) {
      flush();
      const { text: stripped, hint: oxHint } = stripOx(start[2].trim());
      let text = stripped;
      let answer: Answer | null = null;
      const inline = text.match(INLINE_ANSWER);
      const inlineOx = text.match(INLINE_OX_ANSWER);
      if (inline) {
        text = inline[1].trim();
        answer = parseToken(inline[2]);
      } else if (inlineOx) {
        text = inlineOx[1].trim();
        answer = parseToken(inlineOx[2]);
      }
      cur = { num: Number(start[1]), text, oxHint, choices: [], answer };
      continue;
    }

    if (!cur) continue; // 퀴즈 앞의 인사말 등
    if (cur.choices.length === 0 && !cur.answer) {
      const { text: more, hint } = stripOx(line);
      cur.oxHint ||= hint;
      cur.text += " " + more; // 여러 줄 문제
    } else if (cur.choices.length > 0 && !cur.answer) {
      cur.choices[cur.choices.length - 1] += " " + line; // 줄바꿈된 보기
    }
  }
  flush();
  return { questions, warnings };
}
