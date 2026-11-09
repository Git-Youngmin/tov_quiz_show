/** Worker 호스트. 비워 두면 현재 도메인(로컬 개발 시 Vite 프록시)을 사용 */
export const API_HOST: string = import.meta.env.VITE_API_HOST || window.location.host;
export const API_BASE = import.meta.env.VITE_API_HOST
  ? `${location.protocol === "http:" ? "http" : "https"}://${import.meta.env.VITE_API_HOST}`
  : "";
/** wrangler.toml 의 Durable Object 바인딩 QuizRoom → kebab-case */
export const PARTY_NAME = "quiz-room";

/** QR 로 들어올 참가 URL */
export const joinUrl = (pin: string) => `${window.location.origin}/play?pin=${pin}`;
