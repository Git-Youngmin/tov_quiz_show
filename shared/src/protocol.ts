/**
 * 토브 퀴즈쇼 — 프론트엔드(web)와 백엔드(server)가 공유하는 타입/상수/메시지 규약.
 */

// ───────────────────────── 캐릭터 ─────────────────────────

export const CHARACTER_SHAPES = ["capsule", "box", "sphere", "cone"] as const;
export type CharacterShape = (typeof CHARACTER_SHAPES)[number];

export const CHARACTER_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"] as const;
export type CharacterColor = (typeof CHARACTER_COLORS)[number];

export interface Character {
  shape: CharacterShape;
  color: CharacterColor;
}

export const isCharacter = (v: unknown): v is Character => {
  if (!v || typeof v !== "object") return false;
  const c = v as Record<string, unknown>;
  return (
    (CHARACTER_SHAPES as readonly unknown[]).includes(c.shape) &&
    (CHARACTER_COLORS as readonly unknown[]).includes(c.color)
  );
};

// ───────────────────────── 방/게임 상수 ─────────────────────────

export const PIN_LENGTH = 6;
export const NICKNAME_MAX = 12;
export const MAX_PLAYERS = 200;
/** 4지선다 버튼 색 (보기 1~4 순서) */
export const ANSWER_COLORS = ["red", "blue", "yellow", "green"] as const;
export type AnswerIndex = 0 | 1 | 2 | 3;

export const isPin = (v: unknown): v is string => typeof v === "string" && /^\d{6}$/.test(v);

// ───────────────────────── 방 상태 (WebSocket 메모리) ─────────────────────────

export type RoomStatus = "lobby" | "playing" | "leaderboard" | "finished";

export interface PlayerState {
  nickname: string;
  character: Character;
  score: number;
  streak: number;
  connected: boolean;
}

/** 기획안 §4 의 Room State. players 의 key 는 playerId (기기별 고유 id) */
export interface RoomState {
  roomId: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  players: Record<string, PlayerState>;
}

/** choice = 4지선다(빨강/파랑/노랑/초록), ox = O/X 2지선다 */
export type QuestionType = "choice" | "ox";
export const choiceCountOf = (t: QuestionType): 2 | 4 => (t === "ox" ? 2 : 4);

/** D1 Questions 행을 클라이언트용으로 정리한 형태 */
export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  choices: [string, string, string, string];
  /** ox 문제는 ["O","X","",""] 로 저장. 0-based 정답 인덱스 (DB 에는 1~4 로 저장) */
  answerIndex: AnswerIndex;
  timeLimitSec: number;
}

export interface QuizSummary {
  id: number;
  title: string;
  createdAt: string;
  questionCount: number;
}

export interface RankEntry {
  playerId: string;
  nickname: string;
  character: Character;
  score: number;
  streak: number;
  rank: number;
}

// ───────────────────────── REST API ─────────────────────────

/** POST /api/rooms */
export interface CreateRoomRequest {
  quizId: number;
}
export interface CreateRoomResponse {
  pin: string;
  /** 진행자 WebSocket 접속용 일회성 토큰 */
  hostToken: string;
}
/** GET /api/rooms/:pin */
export interface RoomLookupResponse {
  pin: string;
  exists: boolean;
}

/** KV 에 PIN → 방 정보로 저장되는 값 */
export interface RoomRecord {
  quizId: number;
  hostToken: string;
  createdAt: number;
}

// ───────────────────────── WebSocket 메시지 ─────────────────────────
// 접속 URL: /parties/quiz-room/<PIN>?role=host&token=...  |  ?role=player  (+ partysocket id = playerId)

export type ClientMessage =
  | { type: "join"; nickname: string; character: Character }
  | { type: "answer"; questionIndex: number; choice: AnswerIndex }
  // 진행자 전용
  | { type: "host:start" }
  | { type: "host:skip" } // 제한 시간 전에 문제 마감
  | { type: "host:next" }
  | { type: "host:kick"; playerId: string };

export type ServerMessage =
  | { type: "error"; message: string }
  | { type: "state"; state: RoomState }
  /** 진행자에게만: 문제 전체 (텍스트·보기 포함) */
  | { type: "question:host"; index: number; question: Omit<Question, "answerIndex">; endsAt: number }
  /** 참가자에게: 텍스트 없이 버튼 리모컨용 정보만 */
  | { type: "question:player"; index: number; choiceCount: 2 | 4; timeLimitSec: number; endsAt: number }
  /** 진행자에게: 응답 수 갱신 */
  | { type: "answer:count"; answered: number; total: number }
  /** 참가자 본인에게: 제출 접수 */
  | { type: "answer:ack"; questionIndex: number; choice: AnswerIndex }
  /** 문제 마감 후 전체에게 */
  | {
      type: "question:result";
      index: number;
      answerIndex: AnswerIndex;
      /** 보기별 선택 인원 */
      distribution: [number, number, number, number];
      leaderboard: RankEntry[];
    }
  /** 문제 마감 후 참가자 본인에게 */
  | {
      type: "result:player";
      index: number;
      correct: boolean;
      answered: boolean;
      points: number;
      bonus: number;
      totalScore: number;
      streak: number;
      rank: number;
      totalPlayers: number;
    }
  | { type: "kicked" };

// ───────────────────────── 퀴즈 편집 ─────────────────────────

/** 편집 화면에서 저장하는 문항 (answerIndex 는 0-based) */
export interface QuestionInput {
  type: QuestionType;
  text: string;
  choices: [string, string, string, string];
  answerIndex: AnswerIndex;
  timeLimitSec: number;
}
export interface QuizInput {
  title: string;
  questions: QuestionInput[];
}
/** GET /api/quizzes/:id — 정답 포함 (관리자 전용) */
export interface QuizDetail {
  id: number;
  title: string;
  createdAt: string;
  questions: Question[];
}
