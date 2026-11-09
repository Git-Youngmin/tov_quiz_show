import type { AnswerIndex, Question, QuizSummary, RankEntry } from "@tob/shared";

interface QuestionRow {
  id: number;
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
