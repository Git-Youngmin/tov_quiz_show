-- 토브 퀴즈쇼 D1 스키마
-- 적용: npx wrangler d1 execute tob-quiz-db --local --file=./schema.sql   (원격은 --remote)

PRAGMA foreign_keys = ON;

-- 퀴즈 세트
CREATE TABLE IF NOT EXISTS Quizzes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 문항: choice = 4지선다(정답 1~4), ox = O/X (choice1='O', choice2='X', 정답 1 또는 2, choice3·4 는 빈 문자열)
CREATE TABLE IF NOT EXISTS Questions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id         INTEGER NOT NULL REFERENCES Quizzes(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 0,          -- 세트 안에서의 출제 순서
  question_type   TEXT    NOT NULL DEFAULT 'choice' CHECK (question_type IN ('choice', 'ox')),
  question_text   TEXT    NOT NULL,
  choice1         TEXT    NOT NULL,
  choice2         TEXT    NOT NULL,
  choice3         TEXT    NOT NULL,
  choice4         TEXT    NOT NULL,
  correct_choice  INTEGER NOT NULL CHECK (correct_choice BETWEEN 1 AND 4),
  time_limit_sec  INTEGER NOT NULL DEFAULT 20 CHECK (time_limit_sec BETWEEN 5 AND 120)
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON Questions(quiz_id, position);

-- 통계: 진행된 게임 1회
CREATE TABLE IF NOT EXISTS GameSessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id       INTEGER NOT NULL REFERENCES Quizzes(id) ON DELETE CASCADE,
  pin           TEXT    NOT NULL,
  player_count  INTEGER NOT NULL DEFAULT 0,
  started_at    TEXT    NOT NULL,
  finished_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 통계: 게임별 최종 순위
CREATE TABLE IF NOT EXISTS GameResults (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  INTEGER NOT NULL REFERENCES GameSessions(id) ON DELETE CASCADE,
  nickname    TEXT    NOT NULL,
  score       INTEGER NOT NULL,
  rank        INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_session ON GameResults(session_id);
