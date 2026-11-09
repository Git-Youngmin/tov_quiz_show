import type { CreateRoomResponse, QuizDetail, QuizInput, QuizSummary } from "@tob/shared";
import { API_BASE } from "./config.ts";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `요청 실패 (${res.status})`);
  return data as T;
}

export const api = {
  listQuizzes: () => request<QuizSummary[]>("/api/quizzes"),
  getQuiz: (id: number) => request<QuizDetail>(`/api/quizzes/${id}`),
  createQuiz: (input: QuizInput) => request<{ id: number }>("/api/quizzes", { method: "POST", body: JSON.stringify(input) }),
  updateQuiz: (id: number, input: QuizInput) =>
    request<{ id: number }>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteQuiz: (id: number) => request<{ ok: true }>(`/api/quizzes/${id}`, { method: "DELETE" }),
  createRoom: (quizId: number) => request<CreateRoomResponse>("/api/rooms", { method: "POST", body: JSON.stringify({ quizId }) }),
  roomExists: async (pin: string) => {
    try {
      await request(`/api/rooms/${pin}`);
      return true;
    } catch {
      return false;
    }
  },
};
