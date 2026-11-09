import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { choiceCountOf, type AnswerIndex, type QuizSummary } from "@tob/shared";
import { api } from "../lib/api.ts";
import { joinUrl } from "../lib/config.ts";
import { adminSession } from "../lib/storage.ts";
import { rankPlayers } from "../lib/ranking.ts";
import { useCountdown } from "../lib/useCountdown.ts";
import { useRoom } from "../lib/useRoom.ts";
import { AnswerButton } from "../components/AnswerButton.tsx";
import { CharacterAvatar } from "../components/CharacterAvatar.tsx";
import { Leaderboard } from "../components/Leaderboard.tsx";

interface HostRoom {
  pin: string;
  hostToken: string;
}

/**
 * 진행자 플로우: 관리자 인증 → 퀴즈 세트 선택 → PIN/QR 로비 → 문제 진행 → 결과
 * (예배당 스크린에 띄우는 화면이므로 글자를 크게)
 */
export default function HostPage() {
  const [password, setPassword] = useState(adminSession.get());
  const [room, setRoom] = useState<HostRoom | null>(null);

  if (!password) return <AdminLogin onLogin={setPassword} />;
  if (!room) {
    return (
      <QuizPicker
        password={password}
        onCreated={setRoom}
        onLogout={() => {
          adminSession.clear();
          setPassword("");
        }}
      />
    );
  }
  return <HostRoomView room={room} onExit={() => setRoom(null)} />;
}

// ───────────────────────── 1. 관리자 인증 ─────────────────────────

function AdminLogin({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(pw);
      adminSession.set(pw);
      onLogin(pw);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-full place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white/10 p-8">
        <h1 className="text-2xl font-bold">진행자 로그인</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="관리자 비밀번호"
          autoFocus
          className="w-full rounded-xl bg-white px-4 py-3 text-violet-950 outline-none"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button disabled={busy || !pw} className="w-full rounded-xl bg-amber-400 py-3 font-bold text-violet-950 disabled:opacity-50">
          {busy ? "확인 중…" : "로그인"}
        </button>
        <Link to="/" className="block text-center text-sm text-violet-200 underline">
          처음으로
        </Link>
      </form>
    </main>
  );
}

// ───────────────────────── 2. 퀴즈 세트 선택 ─────────────────────────

function QuizPicker({
  password,
  onCreated,
  onLogout,
}: {
  password: string;
  onCreated: (room: HostRoom) => void;
  onLogout: () => void;
}) {
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<number | null>(null);

  useEffect(() => {
    api.listQuizzes(password).then(setQuizzes, (err: Error) => {
      if (err.message === "Unauthorized") onLogout();
      else setError(err.message);
    });
    // onLogout 은 매 렌더 새로 만들어지므로 의존성에서 제외 (password 가 바뀔 때만 다시 조회)
  }, [password]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (quizId: number) => {
    setCreating(quizId);
    try {
      onCreated(await api.createRoom(password, quizId));
    } catch (err) {
      setError((err as Error).message);
      setCreating(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">퀴즈 세트 선택</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/host/quizzes" className="rounded-lg bg-white/10 px-3 py-2 font-bold">
            ✏️ 퀴즈 관리
          </Link>
          <button onClick={onLogout} className="text-violet-200 underline">
            로그아웃
          </button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-500/20 p-3 text-red-200">{error}</p>}
      {!quizzes && !error && <p className="text-violet-200">불러오는 중…</p>}
      {quizzes?.length === 0 && <p className="text-violet-200">퀴즈 세트가 없어요. 위의 "퀴즈 관리"에서 먼저 만들어 주세요.</p>}
      <ul className="space-y-3">
        {quizzes?.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 p-5">
            <div>
              <p className="text-xl font-bold">{q.title}</p>
              <p className="text-sm text-violet-200">
                {q.questionCount}문항 · {q.createdAt.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={() => create(q.id)}
              disabled={creating !== null || q.questionCount === 0}
              className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 font-bold text-violet-950 disabled:opacity-50"
            >
              {creating === q.id ? "방 만드는 중…" : "방 만들기"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

// ───────────────────────── 3. 진행 화면 ─────────────────────────

function HostRoomView({ room, onExit }: { room: HostRoom; onExit: () => void }) {
  const r = useRoom({ pin: room.pin, role: "host", hostToken: room.hostToken });
  const state = r.state;

  if (!state) return <FullMessage text={r.error ?? "방에 연결하는 중…"} />;

  const players = Object.entries(state.players);
  const ranking = rankPlayers(state);

  return (
    <main className="flex min-h-full flex-col">
      <header className="flex items-center justify-between bg-black/20 px-6 py-3 text-lg">
        <span>
          PIN <b className="font-mono text-2xl tracking-widest">{room.pin}</b>
        </span>
        <span>
          {state.status !== "lobby" && `${state.currentQuestionIndex + 1} / ${state.totalQuestions} · `}
          👥 {players.filter(([, p]) => p.connected).length}명
          {!r.connected && <span className="ml-3 text-red-300">연결 끊김 · 재접속 중</span>}
        </span>
      </header>
      {r.error && (
        <button onClick={r.clearError} className="bg-red-500/30 px-6 py-2 text-left">
          {r.error} (닫기)
        </button>
      )}

      {state.status === "lobby" && (
        <section className="grid flex-1 gap-8 p-8 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-violet-950">
            <p className="text-lg">스마트폰으로 QR 을 찍거나</p>
            <QRCodeSVG value={joinUrl(room.pin)} size={280} marginSize={1} />
            <p className="text-lg">
              <b>{window.location.host}/play</b> 에서 PIN 입력
            </p>
            <p className="font-mono text-6xl font-black tracking-[0.2em]">{room.pin}</p>
          </div>
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl font-bold">참가자 {players.length}명</h2>
              <button
                onClick={() => r.send({ type: "host:start" })}
                disabled={players.length === 0}
                className="rounded-2xl bg-amber-400 px-8 py-4 text-2xl font-black text-violet-950 disabled:opacity-40"
              >
                시작 ▶
              </button>
            </div>
            <ul className="flex flex-wrap content-start gap-3">
              {players.map(([id, p]) => (
                <li key={id} className="group flex items-center gap-2 rounded-full bg-white/10 py-1 pr-4 pl-1">
                  <CharacterAvatar character={p.character} size={40} />
                  <span className="text-xl font-bold">{p.nickname}</span>
                  <button
                    onClick={() => r.send({ type: "host:kick", playerId: id })}
                    className="ml-1 hidden text-sm text-red-300 group-hover:inline"
                    aria-label={`${p.nickname} 내보내기`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            {players.length === 0 && <p className="text-xl text-violet-200">참가자를 기다리는 중…</p>}
          </div>
        </section>
      )}

      {state.status === "playing" && r.hostQuestion && (
        <HostQuestion
          q={r.hostQuestion}
          answered={r.answerCount?.answered ?? 0}
          total={r.answerCount?.total ?? players.filter(([, p]) => p.connected).length}
          onSkip={() => r.send({ type: "host:skip" })}
        />
      )}

      {state.status === "leaderboard" && (
        <section className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-8">
          {r.result && r.hostQuestion && (
            <div>
              <h2 className="mb-4 text-3xl font-bold">{r.hostQuestion.question.text}</h2>
              <div className="grid grid-cols-2 gap-3">
                {r.hostQuestion.question.choices.slice(0, choiceCountOf(r.hostQuestion.question.type)).map((c, i) => (
                  <AnswerButton
                    key={i}
                    kind={r.hostQuestion!.question.type}
                    index={i as AnswerIndex}
                    disabled
                    dimmed={i !== r.result!.answerIndex}
                  >
                    {i === r.result!.answerIndex && "✓ "}
                    {r.hostQuestion!.question.type === "ox" ? "" : `${c} · `}
                    {r.result!.distribution[i]}명
                  </AnswerButton>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">순위</h2>
            <button
              onClick={() => r.send({ type: "host:next" })}
              className="rounded-2xl bg-amber-400 px-8 py-4 text-2xl font-black text-violet-950"
            >
              {state.currentQuestionIndex + 1 < state.totalQuestions ? "다음 문제 ▶" : "최종 결과 ▶"}
            </button>
          </div>
          <Leaderboard entries={ranking.slice(0, 5)} />
        </section>
      )}

      {state.status === "finished" && (
        <section className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-8 text-center">
          <h2 className="text-5xl font-black">🏆 최종 순위</h2>
          <Leaderboard entries={ranking.slice(0, 10)} />
          <button onClick={onExit} className="rounded-2xl bg-white/10 px-6 py-3 text-lg">
            다른 퀴즈 진행하기
          </button>
        </section>
      )}
    </main>
  );
}

function HostQuestion({
  q,
  answered,
  total,
  onSkip,
}: {
  q: NonNullable<ReturnType<typeof useRoom>["hostQuestion"]>;
  answered: number;
  total: number;
  onSkip: () => void;
}) {
  const left = useCountdown(q.endsAt);
  return (
    <section className="flex flex-1 flex-col gap-6 p-8">
      <h2 className="rounded-3xl bg-white p-8 text-center text-4xl font-bold text-violet-950 sm:text-5xl">{q.question.text}</h2>
      <div className="flex items-center justify-between text-3xl font-bold">
        <span className="grid size-24 place-items-center rounded-full bg-violet-600 text-5xl">{left}</span>
        <span>
          응답 {answered} / {total}
        </span>
        <button onClick={onSkip} className="rounded-xl bg-white/10 px-4 py-2 text-lg">
          마감하기
        </button>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-4">
        {q.question.choices.slice(0, choiceCountOf(q.question.type)).map((c, i) => (
          <AnswerButton key={i} kind={q.question.type} index={i as AnswerIndex} disabled>
            {q.question.type === "ox" ? "" : c}
          </AnswerButton>
        ))}
      </div>
    </section>
  );
}

function FullMessage({ text }: { text: string }) {
  return <main className="grid min-h-full place-items-center text-2xl">{text}</main>;
}
