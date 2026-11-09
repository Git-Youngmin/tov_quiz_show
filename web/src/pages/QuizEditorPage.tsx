import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  QUIZ_LIMITS,
  parseQuizText,
  validateQuizInput,
  type AnswerIndex,
  type QuestionType,
  type QuizDetail,
  type QuizInput,
  type QuizSummary,
} from "@tob/shared";
import { api } from "../lib/api.ts";
import { ANSWER_STYLES, OX_STYLES } from "../components/AnswerButton.tsx";

interface DraftQuestion {
  key: number; // React key 용 (저장 대상 아님)
  type: QuestionType;
  text: string;
  choices: [string, string, string, string];
  answerIndex: AnswerIndex;
  timeLimitSec: number;
}
interface Draft {
  id: number | null; // null = 새 퀴즈
  title: string;
  questions: DraftQuestion[];
}

let keySeq = 0;
const blankQuestion = (type: QuestionType = "choice"): DraftQuestion => ({
  key: ++keySeq,
  type,
  text: "",
  choices: ["", "", "", ""],
  answerIndex: 0,
  timeLimitSec: type === "ox" ? QUIZ_LIMITS.timeDefaultOx : QUIZ_LIMITS.timeDefault,
});
const isBlank = (q: DraftQuestion) => !q.text.trim() && q.choices.every((c) => !c.trim());
const blankDraft = (): Draft => ({ id: null, title: "", questions: [blankQuestion()] });
const toDraft = (q: QuizDetail): Draft => ({
  id: q.id,
  title: q.title,
  questions: q.questions.map((x) => ({
    key: ++keySeq,
    type: x.type,
    text: x.text,
    choices: [...x.choices] as DraftQuestion["choices"],
    answerIndex: x.answerIndex,
    timeLimitSec: x.timeLimitSec,
  })),
});
const toInput = (d: Draft): QuizInput => ({
  title: d.title,
  questions: d.questions.map(({ type, text, choices, answerIndex, timeLimitSec }) => ({ type, text, choices, answerIndex, timeLimitSec })),
});

/** /host/quizzes — 퀴즈 세트 만들기 · 수정 · 삭제 (운영자 혼자 쓰므로 로그인 없음) */
export default function QuizEditorPage() {
  return <Editor />;
}

function Editor() {
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const parsed = useMemo(() => parseQuizText(importText), [importText]);

  const fail = useCallback((err: Error) => setNotice({ kind: "error", text: err.message }), []);

  const refresh = useCallback(async () => {
    try {
      setQuizzes(await api.listQuizzes());
      setLoadError("");
    } catch (e) {
      setQuizzes([]);
      setLoadError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 저장하지 않은 변경이 있으면 탭 닫기/새로고침 시 경고
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const confirmDiscard = () => !dirty || window.confirm("저장하지 않은 변경 내용이 사라져요. 계속할까요?");

  const edit = (fn: (d: Draft) => Draft) => {
    setDraft((d) => (d ? fn(d) : d));
    setDirty(true);
    setNotice(null);
  };
  const editQuestion = (i: number, patch: Partial<DraftQuestion>) =>
    edit((d) => ({ ...d, questions: d.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));

  const open = async (id: number) => {
    if (!confirmDiscard()) return;
    setNotice(null);
    try {
      setDraft(toDraft(await api.getQuiz(id)));
      setDirty(false);
    } catch (e) {
      fail(e as Error);
    }
  };
  const startNew = () => {
    if (!confirmDiscard()) return;
    setDraft(blankDraft());
    setDirty(false);
    setNotice(null);
  };

  const save = async () => {
    if (!draft) return;
    const checked = validateQuizInput(toInput(draft));
    if (!checked.ok) return setNotice({ kind: "error", text: checked.error });
    setBusy(true);
    try {
      const id = draft.id ?? (await api.createQuiz(checked.value)).id;
      if (draft.id !== null) await api.updateQuiz(draft.id, checked.value);
      setDraft(toDraft(await api.getQuiz(id))); // 서버에 저장된(다듬어진) 값으로 다시 표시
      setDirty(false);
      setNotice({ kind: "ok", text: "저장했어요 ✓" });
      await refresh();
    } catch (e) {
      fail(e as Error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!draft || draft.id === null) return;
    const ok = window.confirm(
      `"${draft.title}" 퀴즈를 삭제할까요?\n이 퀴즈로 진행했던 게임 기록도 함께 지워지고, 되돌릴 수 없어요.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await api.deleteQuiz(draft.id);
      setDraft(null);
      setDirty(false);
      setNotice({ kind: "ok", text: "삭제했어요" });
      await refresh();
    } catch (e) {
      fail(e as Error);
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, to: number) =>
    edit((d) => {
      const qs = [...d.questions];
      [qs[i], qs[to]] = [qs[to], qs[i]];
      return { ...d, questions: qs };
    });
  const duplicate = (i: number) =>
    edit((d) => {
      const qs = [...d.questions];
      qs.splice(i + 1, 0, { ...d.questions[i], key: ++keySeq, choices: [...d.questions[i].choices] as DraftQuestion["choices"] });
      return { ...d, questions: qs };
    });
  const removeQuestion = (i: number) => {
    if (draft && draft.questions.length === 1) return setNotice({ kind: "error", text: "문제는 최소 1개가 있어야 해요" });
    edit((d) => ({ ...d, questions: d.questions.filter((_, j) => j !== i) }));
  };
  const addQuestion = (type: QuestionType) => {
    if (draft && draft.questions.length >= QUIZ_LIMITS.questionsMax) {
      return setNotice({ kind: "error", text: `문제는 ${QUIZ_LIMITS.questionsMax}개까지예요` });
    }
    edit((d) => ({ ...d, questions: [...d.questions, blankQuestion(type)] }));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  /** O/X ↔ 4지선다 전환. 정답이 3·4번이었다면 O/X 에서는 첫 번째로 되돌린다 */
  const changeType = (i: number, type: QuestionType) => {
    const q = draft?.questions[i];
    if (!q || q.type === type) return;
    editQuestion(i, { type, answerIndex: type === "ox" && q.answerIndex > 1 ? 0 : q.answerIndex });
  };

  /** 붙여넣은 글에서 읽어 낸 문제를 현재 퀴즈 뒤에 붙인다 (빈 문제 하나뿐이면 대체) */
  const importQuestions = () => {
    if (!draft || parsed.questions.length === 0) return;
    const room = QUIZ_LIMITS.questionsMax - draft.questions.filter((q) => !isBlank(q)).length;
    if (parsed.questions.length > room) {
      return setNotice({ kind: "error", text: `문제는 ${QUIZ_LIMITS.questionsMax}개까지라서 ${room}개만 더 넣을 수 있어요` });
    }
    const added: DraftQuestion[] = parsed.questions.map((q) => ({ key: ++keySeq, ...q }));
    edit((d) => ({ ...d, questions: [...d.questions.filter((q) => !isBlank(q)), ...added] }));
    setImportText("");
    setImportOpen(false);
    setNotice({ kind: "ok", text: `${added.length}문제를 가져왔어요. 내용을 확인하고 저장해 주세요` });
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[18rem_1fr]">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">퀴즈 관리</h1>
          <Link to="/host" onClick={(e) => !confirmDiscard() && e.preventDefault()} className="text-sm text-mist underline">
            ← PLAY 화면으로
          </Link>
        </div>
        <button onClick={startNew} className="w-full rounded-xl bg-gold-400 py-3 font-bold text-navy-950">
          ＋ 새 퀴즈 만들기
        </button>
        {!quizzes && <p className="text-mist">불러오는 중…</p>}
        {loadError && (
          <div role="alert" className="space-y-2 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">
            <p>{loadError}</p>
            <button onClick={() => void refresh()} className="rounded-lg bg-white/15 px-3 py-1 font-bold">
              다시 시도
            </button>
          </div>
        )}
        <ul className="space-y-2">
          {quizzes?.map((q) => (
            <li key={q.id}>
              <button
                onClick={() => open(q.id)}
                className={`w-full rounded-xl p-3 text-left ${draft?.id === q.id ? "bg-white/25 ring-2 ring-gold-400" : "bg-white/10 hover:bg-white/15"}`}
              >
                <span className="block truncate font-bold">{q.title}</span>
                <span className="text-sm text-mist">{q.questionCount}문항</span>
              </button>
            </li>
          ))}
        </ul>
        {quizzes?.length === 0 && !loadError && <p className="text-sm text-mist">아직 퀴즈가 없어요. 새로 만들어 보세요.</p>}
      </aside>

      <section className="min-w-0">
        {!draft ? (
          <div className="grid h-64 place-items-center rounded-3xl bg-white/5 text-mist">
            왼쪽에서 퀴즈를 고르거나 새로 만들어 주세요
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 -mx-2 flex flex-wrap items-center gap-3 rounded-2xl bg-navy-950/95 px-2 py-3 backdrop-blur">
              <input
                value={draft.title}
                onChange={(e) => edit((d) => ({ ...d, title: e.target.value }))}
                maxLength={QUIZ_LIMITS.titleMax}
                placeholder="퀴즈 제목"
                aria-label="퀴즈 제목"
                className="min-w-0 flex-1 rounded-xl bg-white px-4 py-3 text-xl font-bold text-navy-950 outline-none"
              />
              {draft.id !== null && (
                <button onClick={remove} disabled={busy} className="rounded-xl bg-red-500/20 px-4 py-3 text-red-200 disabled:opacity-50">
                  삭제
                </button>
              )}
              <button
                onClick={save}
                disabled={busy || (!dirty && draft.id !== null)}
                className="rounded-xl bg-gold-400 px-6 py-3 font-bold text-navy-950 disabled:opacity-40"
              >
                {busy ? "저장 중…" : dirty || draft.id === null ? "저장" : "저장됨"}
              </button>
            </div>

            {notice && (
              <p role="status" className={`rounded-xl p-3 ${notice.kind === "ok" ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>
                {notice.text}
              </p>
            )}

            <div className="rounded-2xl bg-white/5 p-4">
              <button
                type="button"
                onClick={() => setImportOpen((o) => !o)}
                aria-expanded={importOpen}
                className="flex w-full items-center justify-between font-bold"
              >
                <span>📋 단톡방에 올리던 글 붙여넣기</span>
                <span aria-hidden>{importOpen ? "▲" : "▼"}</span>
              </button>
              {importOpen && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                    placeholder={"1. 무지개는 하나님의 언약의 증거이다.\n정답: O\n\n2. 하나님이 무지개를 주신 목적은?\n① 가\n② 나\n③ 다\n④ 라\n정답: 3"}
                    aria-label="붙여넣을 퀴즈 글"
                    className="w-full rounded-xl bg-white px-4 py-3 font-mono text-sm text-navy-950 outline-none"
                  />
                  {importText.trim() && (
                    <div className="text-sm" role="status">
                      <p className="font-bold">
                        인식된 문제 {parsed.questions.length}개 (O/X {parsed.questions.filter((q) => q.type === "ox").length} · 4지선다{" "}
                        {parsed.questions.filter((q) => q.type === "choice").length})
                      </p>
                      {parsed.warnings.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gold-200">
                          {parsed.warnings.map((w, k) => (
                            <li key={k}>{w}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-mist">
                      O/X 는 <code>정답: O</code>, 4지선다는 <code>① ② ③ ④</code> 또는 <code>A. B. C. D.</code> 보기 + <code>정답: 3</code> 형식을 읽어요.
                    </p>
                    <button
                      type="button"
                      onClick={importQuestions}
                      disabled={parsed.questions.length === 0}
                      className="shrink-0 rounded-xl bg-gold-400 px-5 py-2 font-bold text-navy-950 disabled:opacity-40"
                    >
                      {parsed.questions.length}문제 가져오기
                    </button>
                  </div>
                </div>
              )}
            </div>

            {draft.questions.map((q, i) => (
              <article key={q.key} className="space-y-3 rounded-2xl bg-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-navy-600 px-3 py-1 text-sm font-bold">{i + 1}번</span>
                  <div className="flex overflow-hidden rounded-lg bg-white/10 text-sm" role="group" aria-label={`${i + 1}번 문제 유형`}>
                    {(["choice", "ox"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => changeType(i, t)}
                        aria-pressed={q.type === t}
                        className={`px-3 py-1 ${q.type === t ? "bg-white font-bold text-navy-950" : ""}`}
                      >
                        {t === "ox" ? "O/X" : "4지선다"}
                      </button>
                    ))}
                  </div>
                  <label className="ml-auto flex items-center gap-2 text-sm">
                    제한 시간
                    <input
                      type="number"
                      min={QUIZ_LIMITS.timeMin}
                      max={QUIZ_LIMITS.timeMax}
                      value={q.timeLimitSec}
                      onChange={(e) => editQuestion(i, { timeLimitSec: Math.round(Number(e.target.value)) })}
                      className="w-20 rounded-lg bg-white px-2 py-1 text-center text-navy-950 outline-none"
                    />
                    초
                  </label>
                  <div className="flex gap-1" role="group" aria-label={`${i + 1}번 문제 도구`}>
                    <IconBtn label="위로" disabled={i === 0} onClick={() => move(i, i - 1)}>↑</IconBtn>
                    <IconBtn label="아래로" disabled={i === draft.questions.length - 1} onClick={() => move(i, i + 1)}>↓</IconBtn>
                    <IconBtn label="복제" onClick={() => duplicate(i)}>⧉</IconBtn>
                    <IconBtn label="삭제" onClick={() => removeQuestion(i)}>🗑</IconBtn>
                  </div>
                </div>

                <textarea
                  value={q.text}
                  onChange={(e) => editQuestion(i, { text: e.target.value })}
                  maxLength={QUIZ_LIMITS.textMax}
                  rows={2}
                  placeholder="문제 내용"
                  aria-label={`${i + 1}번 문제 내용`}
                  className="w-full resize-none rounded-xl bg-white px-4 py-3 text-lg text-navy-950 outline-none"
                />

                {q.type === "ox" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {OX_STYLES.map((s, c) => (
                      <label
                        key={c}
                        className={`flex cursor-pointer items-center justify-center gap-3 rounded-xl p-4 text-2xl font-black text-white ${s.bg} ${q.answerIndex === c ? "ring-4 ring-white" : "opacity-60"}`}
                      >
                        <input
                          type="radio"
                          name={`answer-${q.key}`}
                          checked={q.answerIndex === c}
                          onChange={() => editQuestion(i, { answerIndex: c as AnswerIndex })}
                          aria-label={`${i + 1}번 문제 정답: ${s.label}`}
                          className="size-5"
                        />
                        {s.icon}
                        <span className="text-sm font-bold">정답</span>
                      </label>
                    ))}
                  </div>
                ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {ANSWER_STYLES.map((s, c) => (
                    <div key={c} className={`flex items-center gap-2 rounded-xl p-2 ${s.bg} ${q.answerIndex === c ? "ring-4 ring-white" : "opacity-80"}`}>
                      <span className="w-6 text-center text-2xl" aria-hidden>{s.icon}</span>
                      <input
                        value={q.choices[c]}
                        onChange={(e) => {
                          const choices = [...q.choices] as DraftQuestion["choices"];
                          choices[c] = e.target.value;
                          editQuestion(i, { choices });
                        }}
                        maxLength={QUIZ_LIMITS.choiceMax}
                        placeholder={`${c + 1}번 보기 (${s.label})`}
                        aria-label={`${i + 1}번 문제 ${c + 1}번 보기`}
                        className="min-w-0 flex-1 rounded-lg bg-white/95 px-3 py-2 text-navy-950 outline-none"
                      />
                      <label className="flex items-center gap-1 text-sm font-bold text-white">
                        <input
                          type="radio"
                          name={`answer-${q.key}`}
                          checked={q.answerIndex === c}
                          onChange={() => editQuestion(i, { answerIndex: c as AnswerIndex })}
                          aria-label={`${i + 1}번 문제 정답: ${c + 1}번 보기`}
                          className="size-5"
                        />
                        정답
                      </label>
                    </div>
                  ))}
                </div>
                )}
              </article>
            ))}

            <div ref={bottomRef} className="flex items-center justify-between pb-10">
              <div className="flex gap-2">
                <button onClick={() => addQuestion("ox")} className="rounded-xl bg-white/10 px-5 py-3 font-bold">
                  ＋ O/X 문제
                </button>
                <button onClick={() => addQuestion("choice")} className="rounded-xl bg-white/10 px-5 py-3 font-bold">
                  ＋ 4지선다 문제
                </button>
              </div>
              <span className="text-sm text-mist">
                {draft.questions.length} / {QUIZ_LIMITS.questionsMax}문제
              </span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
