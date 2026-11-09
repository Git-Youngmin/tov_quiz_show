import type { AnswerIndex, Question, QuestionInput, QuizDetail, QuizInput, QuizSummary, RankEntry } from "@tob/shared";

interface QuestionRow {
  id: number;
  question_type: "choice" | "ox";
  question_text: string;
  choice1: string;
  choice2: string;
  choice3: string;
  choice4: string;
  correct_choice: number;
  time_limit_sec: number;
}

export async function listQuizzes(db: D1Database): Promise<QuizSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT q.id, q.title, q.created_at AS createdAt, COUNT(qs.id) AS questionCount
         FROM Quizzes q LEFT JOIN Questions qs ON qs.quiz_id = q.id
        GROUP BY q.id ORDER BY q.created_at DESC, q.id DESC`,
    )
    .all<QuizSummary>();
  return results;
}

export async function quizExists(db: D1Database, quizId: number): Promise<boolean> {
  const row = await db.prepare("SELECT 1 FROM Quizzes WHERE id = ?").bind(quizId).first();
  return row !== null;
}

export async function loadQuestions(db: D1Database, quizId: number): Promise<Question[]> {
  const { results } = await db
    .prepare("SELECT * FROM Questions WHERE quiz_id = ? ORDER BY position, id")
    .bind(quizId)
    .all<QuestionRow>();
  return results.map((r) => ({
    id: r.id,
    type: r.question_type === "ox" ? "ox" : "choice",
    text: r.question_text,
    choices: [r.choice1, r.choice2, r.choice3, r.choice4],
    answerIndex: (r.correct_choice - 1) as AnswerIndex,
    timeLimitSec: r.time_limit_sec,
  }));
}

/** 게임 종료 시 통계 저장 */
export async function saveGameResult(
  db: D1Database,
  opts: { quizId: number; pin: string; startedAt: number; ranking: RankEntry[] },
): Promise<void> {
  const session = await db
    .prepare("INSERT INTO GameSessions (quiz_id, pin, player_count, started_at) VALUES (?, ?, ?, ?) RETURNING id")
    .bind(opts.quizId, opts.pin, opts.ranking.length, new Date(opts.startedAt).toISOString())
    .first<{ id: number }>();
  if (!session || opts.ranking.length === 0) return;
  const insert = db.prepare("INSERT INTO GameResults (session_id, nickname, score, rank) VALUES (?, ?, ?, ?)");
  await db.batch(opts.ranking.map((r) => insert.bind(session.id, r.nickname, r.score, r.rank)));
}

export async function getQuiz(db: D1Database, quizId: number): Promise<QuizDetail | null> {
  const quiz = await db
    .prepare("SELECT id, title, created_at AS createdAt FROM Quizzes WHERE id = ?")
    .bind(quizId)
    .first<Omit<QuizDetail, "questions">>();
  if (!quiz) return null;
  return { ...quiz, questions: await loadQuestions(db, quizId) };
}

function insertQuestion(db: D1Database, quizId: number, position: number, q: QuestionInput) {
  return db
    .prepare(
      `INSERT INTO Questions (quiz_id, position, question_type, question_text, choice1, choice2, choice3, choice4, correct_choice, time_limit_sec)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(quizId, position, q.type, q.text, ...q.choices, q.answerIndex + 1, q.timeLimitSec);
}

export async function createQuiz(db: D1Database, input: QuizInput): Promise<number> {
  const row = await db.prepare("INSERT INTO Quizzes (title) VALUES (?) RETURNING id").bind(input.title).first<{ id: number }>();
  if (!row) throw new Error("퀴즈 생성 실패");
  try {
    await db.batch(input.questions.map((q, i) => insertQuestion(db, row.id, i + 1, q)));
  } catch (err) {
    await db.prepare("DELETE FROM Quizzes WHERE id = ?").bind(row.id).run(); // 문항 저장 실패 시 빈 퀴즈가 남지 않게
    throw err;
  }
  return row.id;
}

/** 제목과 문항 전체를 한 번에 교체 (D1 batch = 트랜잭션). 없는 퀴즈면 false */
export async function replaceQuiz(db: D1Database, quizId: number, input: QuizInput): Promise<boolean> {
  if (!(await quizExists(db, quizId))) return false;
  await db.batch([
    db.prepare("UPDATE Quizzes SET title = ? WHERE id = ?").bind(input.title, quizId),
    db.prepare("DELETE FROM Questions WHERE quiz_id = ?").bind(quizId),
    ...input.questions.map((q, i) => insertQuestion(db, quizId, i + 1, q)),
  ]);
  return true;
}

/** 퀴즈 삭제. 문항과 이 퀴즈로 진행한 게임 통계도 함께 지워진다(ON DELETE CASCADE) */
export async function deleteQuiz(db: D1Database, quizId: number): Promise<boolean> {
  const res = await db.prepare("DELETE FROM Quizzes WHERE id = ?").bind(quizId).run();
  return (res.meta.changes ?? 0) > 0;
}
