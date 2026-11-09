import type { CreateRoomResponse, QuizDetail, QuizInput, QuizSummary } from "@tob/shared";
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
  getQuiz: (password: string, id: number) => request<QuizDetail>(`/api/quizzes/${id}`, {}, password),
  createQuiz: (password: string, input: QuizInput) =>
    request<{ id: number }>("/api/quizzes", { method: "POST", body: JSON.stringify(input) }, password),
  updateQuiz: (password: string, id: number, input: QuizInput) =>
    request<{ id: number }>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(input) }, password),
  deleteQuiz: (password: string, id: number) => request<{ ok: true }>(`/api/quizzes/${id}`, { method: "DELETE" }, password),
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
