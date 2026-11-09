import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import type { QuizSummary } from "@tob/shared";
import { api } from "../lib/api.ts";
import { joinUrl } from "../lib/config.ts";
import { rankPlayers } from "../lib/ranking.ts";
import { useRoom } from "../lib/useRoom.ts";
import { CharacterAvatar } from "../components/CharacterAvatar.tsx";
import { HostQuestion, RoundResult } from "../components/HostRound.tsx";
import { Leaderboard } from "../components/Leaderboard.tsx";
import { MusicCredit } from "../components/MusicCredit.tsx";
import { FinalCeremony } from "../components/FinalCeremony.tsx";
import { SoundToggle } from "../components/SoundToggle.tsx";
import { sound } from "../audio/ClassicalBgmEngine.ts";

interface HostRoom {
  pin: string;
  hostToken: string;
}

/**
 * PLAY(스크린에 띄우는 진행 화면): 퀴즈 세트 선택 → PIN/QR 로비 → 문제 진행 → 결과
 * 운영자 혼자 쓰는 화면이라 로그인 없음. 예배당 스크린에 띄우므로 글자를 크게.
 * 참가자는 이 화면의 QR 로 곧바로 /play?pin=… (독립된 입장 페이지)에 들어온다.
 */
export default function HostPage() {
  const [room, setRoom] = useState<HostRoom | null>(null);
  if (!room) return <QuizPicker onCreated={setRoom} />;
  return <HostRoomView room={room} onExit={() => setRoom(null)} />;
}

// ───────────────────────── 1. 퀴즈 세트 선택 ─────────────────────────

function QuizPicker({ onCreated }: { onCreated: (room: HostRoom) => void }) {
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<number | null>(null);

  useEffect(() => {
    api.listQuizzes().then(setQuizzes, (err: Error) => setError(err.message));
  }, []);

  const create = async (quizId: number) => {
    setCreating(quizId);
    try {
      onCreated(await api.createRoom(quizId));
    } catch (err) {
      setError((err as Error).message);
      setCreating(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif-kr text-3xl font-extrabold">플레이할 퀴즈 고르기</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/host/quizzes" className="rounded-lg bg-white/10 px-3 py-2 font-bold">
            ✏️ 문제 만들기
          </Link>
          <Link to="/" className="text-mist underline">
            처음으로
          </Link>
        </div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-500/20 p-3 text-red-200">{error}</p>}
      {!quizzes && !error && <p className="text-mist">불러오는 중…</p>}
      {quizzes?.length === 0 && <p className="text-mist">퀴즈 세트가 없어요. 위의 "문제 만들기"에서 먼저 만들어 주세요.</p>}
      <ul className="space-y-3">
        {quizzes?.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 p-5">
            <div>
              <p className="text-xl font-bold">{q.title}</p>
              <p className="text-sm text-mist">
                {q.questionCount}문항 · {q.createdAt.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={() => create(q.id)}
              disabled={creating !== null || q.questionCount === 0}
              className="shrink-0 rounded-xl bg-gold-400 px-5 py-3 font-bold text-navy-950 disabled:opacity-50"
            >
              {creating === q.id ? "준비 중…" : "시작하기"}
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

  // 화면 상태에 따라 오케스트라 클래식 BGM 트랙 자동 전환
  useEffect(() => {
    if (!state) return;
    switch (state.status) {
      case "lobby":
        sound.setTrack("lobby");
        break;
      case "playing":
        sound.setTrack("playing");
        break;
      case "leaderboard":
        sound.setTrack("leaderboard");
        break;
      case "finished":
        sound.setTrack("finished");
        break;
    }
  }, [state?.status]);

  useEffect(() => {
    return () => {
      sound.setTrack("off");
    };
  }, []);

  if (!state) return <FullMessage text={r.error ?? "방에 연결하는 중…"} />;

  const players = Object.entries(state.players);
  const ranking = rankPlayers(state);

  return (
    <main className="flex min-h-full flex-col">
      <header className="flex items-center justify-between bg-black/20 px-6 py-3 text-lg">
        <div className="flex items-center gap-4">
          <span>
            PIN <b className="font-mono text-2xl tracking-widest">{room.pin}</b>
          </span>
          <SoundToggle />
        </div>
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
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-navy-950">
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
                className="rounded-2xl bg-gold-400 px-8 py-4 text-2xl font-black text-navy-950 disabled:opacity-40"
              >
                시작 ▶
              </button>
            </div>
            <ul className="flex flex-wrap content-start justify-center gap-x-3 gap-y-5 lg:justify-start">
              {players.map(([id, p]) => (
                <li key={id} className="group relative flex w-24 flex-col items-center">
                  <CharacterAvatar character={p.character} size={72} seed={id} popIn mood={p.connected ? "idle" : "sleepy"} />
                  <span className="glass mt-1 max-w-full truncate rounded-full px-3 py-0.5 text-base font-bold">{p.nickname}</span>
                  <button
                    onClick={() => r.send({ type: "host:kick", playerId: id })}
                    className="absolute -top-1 right-1 hidden size-6 place-items-center rounded-full bg-red-500/80 text-xs group-hover:grid"
                    aria-label={`${p.nickname} 내보내기`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            {players.length === 0 && <p className="text-xl text-mist">참가자를 기다리는 중…</p>}
          </div>
        </section>
      )}

      {state.status === "playing" && r.hostQuestion && (
        <HostQuestion
          q={r.hostQuestion}
          total={state.totalQuestions}
          answered={r.answerCount?.answered ?? 0}
          connected={r.answerCount?.total ?? players.filter(([, p]) => p.connected).length}
          onSkip={() => r.send({ type: "host:skip" })}
        />
      )}

      {state.status === "leaderboard" &&
        (r.result && r.hostQuestion ? (
          <RoundResult
            q={r.hostQuestion}
            result={r.result}
            isLast={state.currentQuestionIndex + 1 >= state.totalQuestions}
            onNext={() => r.send({ type: "host:next" })}
          />
        ) : (
          // 결과 화면 도중에 진행 화면을 새로고침한 경우: 연출 없이 순위만 보여 주고 이어서 진행
          <section className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">순위</h2>
              <button onClick={() => r.send({ type: "host:next" })} className="btn-gold rounded-2xl px-8 py-4 text-2xl font-black">
                {state.currentQuestionIndex + 1 < state.totalQuestions ? "다음 문제 ▶" : "최종 결과 ▶"}
              </button>
            </div>
            <Leaderboard entries={ranking.slice(0, 5)} />
          </section>
        ))}

      {state.status === "finished" && <FinalCeremony ranking={ranking} onExit={onExit} />}

      {/* CC BY 4.0: 배경음악 출처 표기 (스크린에 길게 머무는 로비·최종 화면 아래에) */}
      {(state.status === "lobby" || state.status === "finished") && <MusicCredit className="px-4 pt-2 pb-4" />}
    </main>
  );
}

function FullMessage({ text }: { text: string }) {
  return <main className="grid min-h-full place-items-center text-2xl">{text}</main>;
}
