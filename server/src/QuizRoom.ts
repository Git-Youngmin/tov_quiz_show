/**
 * QuizRoom — PIN 하나당 Durable Object 하나. 방의 모든 상태를 메모리에 들고 WebSocket 으로 브로드캐스트한다.
 *
 * 상태 전이:  lobby ─host:start→ playing ─(시간 종료 / 전원 응답 / host:skip)→ leaderboard
 *                                   ↑                                         │
 *                                   └──────────────── host:next ──────────────┘ (마지막 문제 뒤엔 finished)
 */
import { Server, type Connection, type ConnectionContext, type WSMessage } from "partyserver";
import {
  MAX_PLAYERS,
  choiceCountOf,
  NICKNAME_MAX,
  isCharacter,
  scoreAnswer,
  type AnswerIndex,
  type ClientMessage,
  type Question,
  type RankEntry,
  type RoomRecord,
  type RoomState,
  type ServerMessage,
} from "@tob/shared";
import { loadQuestions, saveGameResult } from "./db.ts";
import type { Env } from "./env.ts";

/** 네트워크 지연을 감안해 제한 시간 뒤 조금 더 기다렸다가 마감 */
const GRACE_MS = 500;
const LEADERBOARD_SIZE = 10;

interface PendingAnswer {
  choice: AnswerIndex;
  responseMs: number;
}

export class QuizRoom extends Server<Env> {
  // 문제 타이머(setTimeout)를 쓰므로 WebSocket hibernation 은 끈다.
  static options = { hibernate: false };

  private room!: RoomState;
  private record: RoomRecord | null = null;
  private questions: Question[] = [];
  private answers = new Map<string, PendingAnswer>();
  private questionStartedAt = 0;
  private questionEndsAt = 0;
  private gameStartedAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async onStart() {
    this.room = {
      roomId: this.name,
      status: "lobby",
      currentQuestionIndex: 0,
      totalQuestions: 0,
      players: {},
    };
    const raw = await this.env.ROOMS.get(this.name);
    if (!raw) return; // 방 없음 → onBeforeConnect 에서 이미 걸러지지만 방어적으로
    this.record = JSON.parse(raw) as RoomRecord;
    this.questions = await loadQuestions(this.env.DB, this.record.quizId);
    this.room.totalQuestions = this.questions.length;
  }

  /** 진행자 토큰이 맞을 때만 "host" 태그를 붙인다. */
  getConnectionTags(_conn: Connection, ctx: ConnectionContext): string[] {
    const url = new URL(ctx.request.url);
    const wantsHost = url.searchParams.get("role") === "host";
    const token = url.searchParams.get("token");
    return wantsHost && this.record && token === this.record.hostToken ? ["host"] : ["player"];
  }

  onConnect(conn: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    if (url.searchParams.get("role") === "host" && !conn.tags.includes("host")) {
      this.send(conn, { type: "error", message: "진행자 인증에 실패했어요" });
      conn.close(4001, "unauthorized");
      return;
    }
    this.send(conn, { type: "state", state: this.room });

    if (conn.tags.includes("host")) {
      // 진행자가 새로고침해도 진행 중인 문제를 다시 받도록
      if (this.room.status === "playing") this.sendQuestionTo(conn, "host");
      return;
    }
    // 재접속한 참가자 (같은 playerId)
    const player = this.room.players[conn.id];
    if (player) {
      player.connected = true;
      this.broadcastState();
      if (this.room.status === "playing" && !this.answers.has(conn.id)) this.sendQuestionTo(conn, "player");
    }
  }

  onClose(conn: Connection) {
    const player = this.room.players[conn.id];
    if (!player) return;
    if (this.room.status === "lobby") delete this.room.players[conn.id];
    else player.connected = false;
    this.broadcastState();
    // 아직 답하지 않은 사람이 나가서 남은 전원이 답한 상태가 되면 마감
    const remaining = this.connectedPlayerIds();
    if (this.room.status === "playing" && remaining.length > 0 && remaining.every((id) => this.answers.has(id))) {
      this.endQuestion();
    }
  }

  onMessage(conn: Connection, message: WSMessage) {
    if (typeof message !== "string") return;
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message) as ClientMessage;
    } catch {
      return;
    }
    const isHost = conn.tags.includes("host");

    switch (msg.type) {
      case "join":
        return this.handleJoin(conn, msg.nickname, msg.character);
      case "answer":
        return this.handleAnswer(conn, msg.questionIndex, msg.choice);
      case "host:start":
        if (isHost && this.room.status === "lobby") this.startGame(conn);
        return;
      case "host:skip":
        if (isHost && this.room.status === "playing") this.endQuestion();
        return;
      case "host:next":
        if (isHost && this.room.status === "leaderboard") this.nextQuestion();
        return;
      case "host:kick":
        if (isHost) this.kick(msg.playerId);
        return;
    }
  }

  // ───────────────────────── 참가자 ─────────────────────────

  private handleJoin(conn: Connection, rawNickname: unknown, character: unknown) {
    if (conn.tags.includes("host")) return;
    const nickname = typeof rawNickname === "string" ? rawNickname.trim().slice(0, NICKNAME_MAX) : "";
    if (!nickname) return this.send(conn, { type: "error", message: "닉네임을 입력해 주세요" });
    if (!isCharacter(character)) return this.send(conn, { type: "error", message: "캐릭터를 골라 주세요" });
    if (this.room.status === "finished") return this.send(conn, { type: "error", message: "이미 끝난 게임이에요" });

    const existing = this.room.players[conn.id];
    const taken = Object.entries(this.room.players).some(([id, p]) => id !== conn.id && p.nickname === nickname);
    if (taken) return this.send(conn, { type: "error", message: "이미 사용 중인 닉네임이에요" });
    if (!existing && Object.keys(this.room.players).length >= MAX_PLAYERS) {
      return this.send(conn, { type: "error", message: "방이 가득 찼어요" });
    }

    this.room.players[conn.id] = existing
      ? { ...existing, nickname, character, connected: true }
      : { nickname, character, score: 0, streak: 0, connected: true };
    this.broadcastState();
    if (this.room.status === "playing" && !this.answers.has(conn.id)) this.sendQuestionTo(conn, "player");
  }

  private handleAnswer(conn: Connection, questionIndex: number, choice: unknown) {
    if (this.room.status !== "playing" || questionIndex !== this.room.currentQuestionIndex) return;
    if (!this.room.players[conn.id] || this.answers.has(conn.id)) return;
    if (choice !== 0 && choice !== 1 && choice !== 2 && choice !== 3) return;
    if (choice >= choiceCountOf(this.questions[questionIndex].type)) return; // O/X 문제에 3·4번 버튼은 없음

    this.answers.set(conn.id, { choice, responseMs: Date.now() - this.questionStartedAt });
    this.send(conn, { type: "answer:ack", questionIndex, choice });

    const total = this.connectedPlayerIds().length;
    this.sendToHosts({ type: "answer:count", answered: this.answers.size, total });
    // 접속 중인 전원이 답하면 바로 마감
    if (this.connectedPlayerIds().every((id) => this.answers.has(id))) this.endQuestion();
  }

  private kick(playerId: string) {
    if (!this.room.players[playerId]) return;
    delete this.room.players[playerId];
    this.answers.delete(playerId);
    const conn = this.getConnection(playerId);
    if (conn) {
      this.send(conn, { type: "kicked" });
      conn.close(4002, "kicked");
    }
    this.broadcastState();
  }

  // ───────────────────────── 진행 ─────────────────────────

  private startGame(host: Connection) {
    if (this.questions.length === 0) {
      return this.send(host, { type: "error", message: "문제가 없는 퀴즈 세트예요" });
    }
    if (Object.keys(this.room.players).length === 0) {
      return this.send(host, { type: "error", message: "참가자가 아직 없어요" });
    }
    this.gameStartedAt = Date.now();
    this.startQuestion(0);
  }

  private startQuestion(index: number) {
    const q = this.questions[index];
    this.room.status = "playing";
    this.room.currentQuestionIndex = index;
    this.answers.clear();
    this.questionStartedAt = Date.now();
    this.questionEndsAt = this.questionStartedAt + q.timeLimitSec * 1000;

    this.broadcastState();
    for (const c of this.getConnections("host")) this.sendQuestionTo(c, "host");
    for (const c of this.getConnections("player")) {
      if (this.room.players[c.id]) this.sendQuestionTo(c, "player");
    }
    this.clearTimer();
    this.timer = setTimeout(() => this.endQuestion(), q.timeLimitSec * 1000 + GRACE_MS);
  }

  private endQuestion() {
    if (this.room.status !== "playing") return;
    this.clearTimer();
    const index = this.room.currentQuestionIndex;
    const q = this.questions[index];
    const distribution: [number, number, number, number] = [0, 0, 0, 0];
    const perPlayer = new Map<string, { answered: boolean; correct: boolean; points: number; bonus: number }>();

    for (const [id, player] of Object.entries(this.room.players)) {
      const a = this.answers.get(id);
      if (a) distribution[a.choice]++;
      const correct = a?.choice === q.answerIndex;
      const s = scoreAnswer({
        correct,
        responseMs: a?.responseMs ?? 0,
        timeLimitMs: q.timeLimitSec * 1000,
        prevStreak: player.streak,
      });
      player.score += s.points;
      player.streak = s.streak;
      perPlayer.set(id, { answered: !!a, correct, points: s.points, bonus: s.bonus });
    }

    this.room.status = "leaderboard";
    const ranking = this.ranking();
    this.broadcastState();
    this.broadcastMsg({
      type: "question:result",
      index,
      answerIndex: q.answerIndex,
      distribution,
      leaderboard: ranking.slice(0, LEADERBOARD_SIZE),
    });
    for (const r of ranking) {
      const conn = this.getConnection(r.playerId);
      const p = perPlayer.get(r.playerId);
      if (!conn || !p) continue;
      this.send(conn, {
        type: "result:player",
        index,
        ...p,
        totalScore: r.score,
        streak: r.streak,
        rank: r.rank,
        totalPlayers: ranking.length,
      });
    }
  }

  private nextQuestion() {
    const next = this.room.currentQuestionIndex + 1;
    if (next < this.questions.length) return this.startQuestion(next);

    this.room.status = "finished";
    this.broadcastState();
    if (this.record) {
      this.ctx.waitUntil(
        saveGameResult(this.env.DB, {
          quizId: this.record.quizId,
          pin: this.name,
          startedAt: this.gameStartedAt,
          ranking: this.ranking(),
        }).catch((err) => console.error("통계 저장 실패", err)),
      );
    }
  }

  // ───────────────────────── 유틸 ─────────────────────────

  private sendQuestionTo(conn: Connection, role: "host" | "player") {
    const index = this.room.currentQuestionIndex;
    const q = this.questions[index];
    if (!q) return;
    if (role === "host") {
      const { answerIndex: _hidden, ...publicQuestion } = q;
      this.send(conn, { type: "question:host", index, question: publicQuestion, endsAt: this.questionEndsAt });
    } else {
      this.send(conn, {
        type: "question:player",
        index,
        choiceCount: choiceCountOf(q.type),
        timeLimitSec: q.timeLimitSec,
        endsAt: this.questionEndsAt,
      });
    }
  }

  /** 점수 내림차순, 동점은 같은 등수 */
  private ranking(): RankEntry[] {
    const sorted = Object.entries(this.room.players).sort(([, a], [, b]) => b.score - a.score);
    let rank = 0;
    let prevScore = Number.NaN;
    return sorted.map(([playerId, p], i) => {
      if (p.score !== prevScore) {
        rank = i + 1;
        prevScore = p.score;
      }
      return { playerId, nickname: p.nickname, character: p.character, score: p.score, streak: p.streak, rank };
    });
  }

  private connectedPlayerIds(): string[] {
    return Object.entries(this.room.players)
      .filter(([, p]) => p.connected)
      .map(([id]) => id);
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private send(conn: Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcastMsg(msg: ServerMessage) {
    this.broadcast(JSON.stringify(msg));
  }

  private broadcastState() {
    this.broadcastMsg({ type: "state", state: this.room });
  }

  private sendToHosts(msg: ServerMessage) {
    const data = JSON.stringify(msg);
    for (const c of this.getConnections("host")) c.send(data);
  }
}
