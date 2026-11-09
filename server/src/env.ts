import type { QuizRoom } from "./QuizRoom.ts";

export interface Env {
  /** Durable Object 네임스페이스 (PartyServer) */
  QuizRoom: DurableObjectNamespace<QuizRoom>;
  /** 퀴즈 세트·통계 */
  DB: D1Database;
  /** PIN → RoomRecord */
  ROOMS: KVNamespace;
  ALLOWED_ORIGINS: string;
}
