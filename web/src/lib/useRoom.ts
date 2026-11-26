import { useCallback, useState } from "react";
import usePartySocket from "partysocket/react";
import type { ClientMessage, RoomState, ServerMessage } from "@tob/shared";
import { syncServerClock } from "./clock.ts";
import { API_HOST, PARTY_NAME } from "./config.ts";

type Extract_<T extends ServerMessage["type"]> = Extract<ServerMessage, { type: T }>;

export interface RoomView {
  state: RoomState | null;
  hostQuestion: Extract_<"question:host"> | null;
  playerQuestion: Extract_<"question:player"> | null;
  answerCount: Extract_<"answer:count"> | null;
  myAnswer: Extract_<"answer:ack"> | null;
  result: Extract_<"question:result"> | null;
  myResult: Extract_<"result:player"> | null;
  error: string | null;
  kicked: boolean;
  /** 진행자가 나가서 방이 끝남 */
  closed: boolean;
  connected: boolean;
}

const EMPTY: RoomView = {
  state: null,
  hostQuestion: null,
  playerQuestion: null,
  answerCount: null,
  myAnswer: null,
  result: null,
  myResult: null,
  error: null,
  kicked: false,
  closed: false,
  connected: false,
};

/**
 * PIN 방에 WebSocket(PartySocket) 으로 접속하고 서버 메시지를 화면용 상태로 모은다.
 * pin 이 null 이면 접속하지 않는다.
 */
export function useRoom(opts: {
  pin: string | null;
  role: "host" | "player";
  id?: string;
  hostToken?: string;
  onOpen?: () => void;
}) {
  const [view, setView] = useState<RoomView>(EMPTY);

  const socket = usePartySocket({
    host: API_HOST,
    party: PARTY_NAME,
    room: opts.pin ?? "_",
    id: opts.id,
    query: opts.role === "host" ? { role: "host", token: opts.hostToken ?? "" } : { role: "player" },
    enabled: !!opts.pin,
    onOpen() {
      setView((v) => ({ ...v, connected: true, error: null }));
      opts.onOpen?.();
    },
    onClose() {
      setView((v) => ({ ...v, connected: false }));
    },
    onMessage(event: MessageEvent) {
      const msg = JSON.parse(event.data as string) as ServerMessage;
      // 카운트다운이 모든 화면에서 같이 가도록 서버 시계와의 차이를 기억
      if (msg.type === "question:host" || msg.type === "question:player") syncServerClock(msg.now);
      setView((v) => reduce(v, msg));
      // 끝난 방/내보내진 방에는 자동 재접속을 멈춘다 (계속 두드리지 않도록)
      if (msg.type === "closed" || msg.type === "kicked") socket.close();
    },
  });

  const send = useCallback((msg: ClientMessage) => socket.send(JSON.stringify(msg)), [socket]);
  const clearError = useCallback(() => setView((v) => ({ ...v, error: null })), []);

  return { ...view, send, clearError };
}

function reduce(v: RoomView, msg: ServerMessage): RoomView {
  switch (msg.type) {
    case "state":
      return { ...v, state: msg.state };
    case "question:host":
      return { ...v, hostQuestion: msg, answerCount: null, result: null };
    case "question:player":
      return { ...v, playerQuestion: msg, myAnswer: null, result: null, myResult: null };
    case "answer:count":
      return { ...v, answerCount: msg };
    case "answer:ack":
      return { ...v, myAnswer: msg };
    case "question:result":
      return { ...v, result: msg };
    case "result:player":
      return { ...v, myResult: msg };
    case "error":
      return { ...v, error: msg.message };
    case "kicked":
      return { ...v, kicked: true };
    case "closed":
      return { ...v, closed: true };
  }
}
