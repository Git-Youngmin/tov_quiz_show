import type { CreateRoomResponse, QuizSummary } from "@tob/shared";
import { API_BASE } from "./config.ts";

async function request<T>(path: string, init: RequestInit = {}, password?: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(password ? { Authorization: `Bearer ${password}` } : {}),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `요청 실패 (${res.status})`);
  return data as T;
}

export const api = {
  login: (password: string) => request<{ ok: true }>("/api/auth", { method: "POST" }, password),
  listQuizzes: (password: string) => request<QuizSummary[]>("/api/quizzes", {}, password),
  createRoom: (password: string, quizId: number) =>
    request<CreateRoomResponse>("/api/rooms", { method: "POST", body: JSON.stringify({ quizId }) }, password),
  roomExists: async (pin: string) => {
    try {
      await request(`/api/rooms/${pin}`);
      return true;
    } catch {
      return false;
    }
  },
};
