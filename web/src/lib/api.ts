import type { CreateRoomResponse, QuizDetail, QuizInput, QuizSummary } from "@tob/shared";
import { API_BASE } from "./config.ts";

const NO_SERVER =
  "서버에 연결할 수 없어요. 서버(Worker)를 배포했는지, 화면 배포 설정의 VITE_API_HOST 에 서버 주소가 들어 있는지 확인해 주세요.";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new Error(NO_SERVER);
  }
  // 서버가 없으면 Pages 가 index.html(HTML)을 돌려주므로 JSON 이 아니면 "서버 연결 안 됨"으로 본다
  const isJson = (res.headers.get("content-type") ?? "").includes("json");
  if (!isJson) throw new Error(NO_SERVER);
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
