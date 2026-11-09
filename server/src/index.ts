/**
 * Worker 진입점
 *  - /parties/quiz-room/<PIN>  → PartyServer(Durable Object) WebSocket
 *  - /api/*                    → REST (관리자 인증, 퀴즈 목록, 방 생성, PIN 조회)
 */
import { routePartykitRequest } from "partyserver";
import { PIN_LENGTH, isPin, validateQuizInput, type CreateRoomRequest, type RoomRecord } from "@tob/shared";
import { createQuiz, deleteQuiz, getQuiz, listQuizzes, quizExists, replaceQuiz } from "./db.ts";
import type { Env } from "./env.ts";

export { QuizRoom } from "./QuizRoom.ts";

/** 방(KV 레코드) 유지 시간 */
const ROOM_TTL_SEC = 6 * 60 * 60;

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // 1) WebSocket: 존재하는 PIN 으로만 접속 허용
    const partyResponse = await routePartykitRequest(request, env, {
      cors,
      onBeforeConnect: async (_req, lobby) => {
        if (!isPin(lobby.name) || !(await env.ROOMS.get(lobby.name))) {
          return new Response("Room not found", { status: 404 });
        }
      },
    });
    if (partyResponse) return partyResponse;

    // 2) REST
    try {
      const res = await handleApi(request, env);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch (err) {
      console.error(err);
      return json({ error: "서버 오류" }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === "/api/health") return json({ ok: true });

  // 퀴즈 세트 관리 (운영자 혼자 쓰는 서비스라 잠금 없음)
  if (pathname === "/api/quizzes" || pathname.startsWith("/api/quizzes/")) {
    if (pathname === "/api/quizzes") {
      if (request.method === "GET") return json(await listQuizzes(env.DB));
      if (request.method === "POST") {
        const parsed = validateQuizInput(await request.json().catch(() => null));
        if (!parsed.ok) return json({ error: parsed.error }, 400);
        return json({ id: await createQuiz(env.DB, parsed.value) }, 201);
      }
    }

    const m = pathname.match(/^\/api\/quizzes\/(\d+)$/);
    if (m) {
      const id = Number(m[1]);
      if (request.method === "GET") {
        const quiz = await getQuiz(env.DB, id);
        return quiz ? json(quiz) : json({ error: "퀴즈를 찾을 수 없어요" }, 404);
      }
      if (request.method === "PUT") {
        const parsed = validateQuizInput(await request.json().catch(() => null));
        if (!parsed.ok) return json({ error: parsed.error }, 400);
        return (await replaceQuiz(env.DB, id, parsed.value)) ? json({ id }) : json({ error: "퀴즈를 찾을 수 없어요" }, 404);
      }
      if (request.method === "DELETE") {
        return (await deleteQuiz(env.DB, id)) ? json({ ok: true }) : json({ error: "퀴즈를 찾을 수 없어요" }, 404);
      }
    }
  }

  // 방 만들기: PIN 발급 + KV 등록
  if (pathname === "/api/rooms" && request.method === "POST") {
    const body = (await request.json().catch(() => null)) as Partial<CreateRoomRequest> | null;
    const quizId = Number(body?.quizId);
    if (!Number.isInteger(quizId) || !(await quizExists(env.DB, quizId))) {
      return json({ error: "퀴즈 세트를 찾을 수 없어요" }, 400);
    }
    const pin = await allocatePin(env);
    const record: RoomRecord = { quizId, hostToken: crypto.randomUUID(), createdAt: Date.now() };
    await env.ROOMS.put(pin, JSON.stringify(record), { expirationTtl: ROOM_TTL_SEC });
    return json({ pin, hostToken: record.hostToken }, 201);
  }

  // PIN 조회 (참가자 입장 전 확인)
  const lookup = pathname.match(/^\/api\/rooms\/(\d+)$/);
  if (lookup && request.method === "GET") {
    const pin = lookup[1];
    const exists = isPin(pin) && (await env.ROOMS.get(pin)) !== null;
    return json({ pin, exists }, exists ? 200 : 404);
  }

  return json({ error: "Not found" }, 404);
}

/** 사용 중이지 않은 6자리 PIN (KV 충돌 확인) */
async function allocatePin(env: Env): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10 ** PIN_LENGTH;
    const pin = String(n).padStart(PIN_LENGTH, "0");
    if (pin.startsWith("0")) continue; // 앞자리 0 은 입력 시 헷갈리므로 제외
    if ((await env.ROOMS.get(pin)) === null) return pin;
  }
  throw new Error("PIN 발급 실패");
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  const allow = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
