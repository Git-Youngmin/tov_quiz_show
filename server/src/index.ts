/**
 * Worker 진입점
 *  - /parties/quiz-room/<PIN>  → PartyServer(Durable Object) WebSocket
 *  - /api/*                    → REST (관리자 인증, 퀴즈 목록, 방 생성, PIN 조회)
 */
import { routePartykitRequest } from "partyserver";
import { PIN_LENGTH, isPin, type CreateRoomRequest, type RoomRecord } from "@tob/shared";
import { listQuizzes, quizExists } from "./db.ts";
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

  // 관리자 비밀번호 확인 (로그인 화면용)
  if (pathname === "/api/auth" && request.method === "POST") {
    return isAdmin(request, env) ? json({ ok: true }) : json({ error: "비밀번호가 틀렸어요" }, 401);
  }

  if (pathname === "/api/quizzes" && request.method === "GET") {
    if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
    return json(await listQuizzes(env.DB));
  }

  // 방 만들기: PIN 발급 + KV 등록
  if (pathname === "/api/rooms" && request.method === "POST") {
    if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
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

function isAdmin(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  return !!env.ADMIN_PASSWORD && timingSafeEqual(given, env.ADMIN_PASSWORD);
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  const allow = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
