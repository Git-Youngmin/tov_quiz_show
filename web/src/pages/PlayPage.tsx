import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CHARACTER_COLORS,
  CHARACTER_SHAPES,
  NICKNAME_MAX,
  isPin,
  type AnswerIndex,
  type Character,
} from "@tob/shared";
import { api } from "../lib/api.ts";
import { getPlayerId, loadProfile, saveProfile, type Profile } from "../lib/storage.ts";
import { rankPlayers } from "../lib/ranking.ts";
import { useCountdown } from "../lib/useCountdown.ts";
import { useRoom } from "../lib/useRoom.ts";
import { AnswerButton } from "../components/AnswerButton.tsx";
import { COLOR_HEX, COLOR_LABEL, CharacterAvatar, SHAPE_NICK } from "../components/CharacterAvatar.tsx";

/**
 * 참가자 입장 페이지 (카훗처럼 QR 로 바로 들어오는 독립된 페이지 — 홈으로 가는 링크 없음)
 *   QR(/play?pin=123456) → PIN 이 맞으면 곧장 닉네임·캐릭터 → 대기 → 4색(또는 O/X) 리모컨 → 결과
 *   PIN 없이 주소만 열었을 때만 PIN 입력 칸이 나온다.
 */
export default function PlayPage() {
  const [params, setParams] = useSearchParams();
  const queryPin = params.get("pin");
  const [pin, setPin] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(isPin(queryPin));
  const [notFound, setNotFound] = useState(false);

  // QR 로 들어왔으면 PIN 입력 단계를 건너뛰고 방이 있는지만 확인
  useEffect(() => {
    if (!isPin(queryPin)) return;
    let alive = true;
    void api.roomExists(queryPin).then((ok) => {
      if (!alive) return;
      if (ok) setPin(queryPin);
      else setNotFound(true);
      setChecking(false);
    });
    return () => {
      alive = false;
    };
    // 처음 한 번만 확인
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) return <Center title="입장하는 중…" />;
  if (!pin) {
    return (
      <PinEntry
        initialPin={isPin(queryPin) ? queryPin : ""}
        initialError={notFound ? "방을 찾을 수 없어요. 스크린의 PIN 을 다시 확인해 주세요" : ""}
        onValid={(p) => {
          setPin(p);
          setParams({ pin: p }, { replace: true });
        }}
      />
    );
  }
  if (!profile) return <ProfileForm pin={pin} onSubmit={setProfile} onBack={() => setPin(null)} />;
  return <PlayerGame pin={pin} profile={profile} onEditProfile={() => setProfile(null)} />;
}

// ───────────────────────── 1. PIN 입력 ─────────────────────────

function PinEntry({ initialPin, initialError, onValid }: { initialPin: string; initialError: string; onValid: (pin: string) => void }) {
  const [value, setValue] = useState(initialPin);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!isPin(value)) return setError("6자리 숫자를 입력해 주세요");
    setBusy(true);
    const exists = await api.roomExists(value);
    setBusy(false);
    if (exists) onValid(value);
    else setError("방을 찾을 수 없어요. PIN 을 확인해 주세요");
  };

  return (
    <main className="grid min-h-full place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-4xl font-black">토브 퀴즈쇼</h1>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, ""));
            setError("");
          }}
          placeholder="PIN 6자리"
          autoFocus
          className="w-full rounded-2xl bg-white px-4 py-4 text-center font-mono text-3xl tracking-[0.3em] text-navy-950 outline-none"
        />
        {error && <p className="text-red-300">{error}</p>}
        <button disabled={busy} className="w-full rounded-2xl bg-gold-400 py-4 text-xl font-bold text-navy-950 disabled:opacity-50">
          {busy ? "확인 중…" : "입장하기"}
        </button>
      </form>
    </main>
  );
}

// ───────────────────────── 2. 닉네임 + 캐릭터 ─────────────────────────

function ProfileForm({ pin, onSubmit, onBack }: { pin: string; onSubmit: (p: Profile) => void; onBack: () => void }) {
  const saved = useMemo(loadProfile, []);
  const [nickname, setNickname] = useState(saved.nickname);
  const [character, setCharacter] = useState<Character>(saved.character);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = { nickname: nickname.trim(), character };
    if (!p.nickname) return;
    saveProfile(p);
    onSubmit(p);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-8">
      <form onSubmit={submit} className="space-y-6">
        <p className="text-center text-mist">
          PIN <b className="font-mono">{pin}</b>{" "}
          <button type="button" onClick={onBack} className="underline">
            변경
          </button>
        </p>
        <div className="flex justify-center">
          <CharacterAvatar key={`${character.shape}${character.color}`} character={character} size={150} popIn />
        </div>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
          placeholder="닉네임"
          autoFocus
          className="w-full rounded-2xl bg-white px-4 py-4 text-center text-2xl font-bold text-navy-950 outline-none"
        />

        <fieldset>
          <legend className="mb-2 font-bold">모양</legend>
          <div className="grid grid-cols-4 gap-2">
            {CHARACTER_SHAPES.map((shape) => (
              <button
                type="button"
                key={shape}
                onClick={() => setCharacter((c) => ({ ...c, shape }))}
                aria-pressed={character.shape === shape}
                className={`flex flex-col items-center rounded-xl p-2 ${
                  character.shape === shape ? "bg-white/30 ring-2 ring-gold-400" : "bg-white/10"
                }`}
              >
                <CharacterAvatar character={{ ...character, shape }} size={46} bust />
                <span className="text-sm">{SHAPE_NICK[shape]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 font-bold">색상</legend>
          <div className="grid grid-cols-6 gap-2">
            {CHARACTER_COLORS.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => setCharacter((c) => ({ ...c, color }))}
                aria-label={COLOR_LABEL[color]}
                aria-pressed={character.color === color}
                style={{ backgroundColor: COLOR_HEX[color] }}
                className={`aspect-square rounded-full ${character.color === color ? "ring-4 ring-white" : ""}`}
              />
            ))}
          </div>
        </fieldset>

        <button
          disabled={!nickname.trim()}
          className="w-full rounded-2xl bg-gold-400 py-4 text-xl font-bold text-navy-950 disabled:opacity-50"
        >
          참가하기
        </button>
      </form>
    </main>
  );
}

// ───────────────────────── 3. 게임 (리모컨) ─────────────────────────

function PlayerGame({ pin, profile, onEditProfile }: { pin: string; profile: Profile; onEditProfile: () => void }) {
  const playerId = useMemo(getPlayerId, []);
  const r = useRoom({
    pin,
    role: "player",
    id: playerId,
    // 연결(재연결) 될 때마다 입장 메시지 → 서버가 같은 playerId 면 점수를 유지
    onOpen: () => sendJoin(),
  });
  const sendJoin = () => r.send({ type: "join", nickname: profile.nickname, character: profile.character });

  if (r.kicked) return <Center title="진행자가 방에서 내보냈어요" />;

  const state = r.state;
  const me = state?.players[playerId];

  // 닉네임 중복 등 입장 오류
  if (r.error && !me) {
    return (
      <Center title={r.error}>
        <button onClick={onEditProfile} className="mt-6 rounded-2xl bg-gold-400 px-6 py-3 font-bold text-navy-950">
          다시 입력하기
        </button>
      </Center>
    );
  }
  if (!state || !me) return <Center title="입장하는 중…" />;

  const ranking = rankPlayers(state);
  const myRank = ranking.find((e) => e.playerId === playerId);

  return (
    <main className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 bg-black/20 px-4 py-2">
        <CharacterAvatar character={me.character} size={38} bust />
        <span className="flex-1 truncate font-bold">{me.nickname}</span>
        {!r.connected && <span className="text-sm text-red-300">재접속 중…</span>}
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono font-bold">{me.score.toLocaleString()}</span>
      </header>

      {state.status === "lobby" && (
        <Center
          title="입장 완료!"
          subtitle="스크린에서 내 이름을 확인하세요. 곧 시작해요"
          avatar={<CharacterAvatar character={me.character} size={150} seed={playerId} popIn />}
        />
      )}

      {state.status === "playing" &&
        (r.playerQuestion && !r.myAnswer ? (
          <Remote
            q={r.playerQuestion}
            onAnswer={(choice) => r.send({ type: "answer", questionIndex: r.playerQuestion!.index, choice })}
          />
        ) : r.myAnswer ? (
          <Center
            title="제출 완료!"
            subtitle="다른 친구들을 기다리는 중…"
            avatar={<CharacterAvatar character={me.character} size={130} mood="sleepy" seed={playerId} />}
          />
        ) : (
          <Center title="문제를 기다리는 중…" />
        ))}

      {state.status === "leaderboard" &&
        (r.myResult ? (
          <section
            className={`flex flex-1 flex-col items-center justify-center gap-3 text-center ${
              r.myResult.correct ? "bg-green-600/75" : "bg-red-600/75"
            }`}
          >
            <CharacterAvatar
              character={me.character}
              size={170}
              mood={r.myResult.correct ? "cheer" : r.myResult.answered ? "sad" : "sleepy"}
              seed={playerId}
              popIn
            />
            <p className="text-5xl font-black">
              {r.myResult.correct ? "정답! 🎉" : r.myResult.answered ? "아쉬워요 😢" : "시간 초과 ⏰"}
            </p>
            {r.myResult.correct && <p className="text-3xl font-bold">+{r.myResult.points.toLocaleString()}</p>}
            {r.myResult.bonus > 0 && <p className="text-xl">🔥 {r.myResult.streak}연속 정답 보너스 +{r.myResult.bonus}</p>}
            <p className="mt-4 rounded-full bg-black/20 px-6 py-2 text-xl">
              현재 {r.myResult.rank}등 / {r.myResult.totalPlayers}명
            </p>
          </section>
        ) : (
          <Center title="결과 집계 중…" />
        ))}

      {state.status === "finished" && (
        <Center
          title="게임 끝!"
          subtitle={myRank ? `최종 ${myRank.rank}등 · ${myRank.score.toLocaleString()}점` : undefined}
          avatar={<CharacterAvatar character={me.character} size={150} mood={myRank && myRank.rank <= 3 ? "cheer" : "idle"} seed={playerId} popIn />}
        />
      )}
    </main>
  );
}

/** 문제 텍스트 없이 4색 버튼만 */
function Remote({
  q,
  onAnswer,
}: {
  q: NonNullable<ReturnType<typeof useRoom>["playerQuestion"]>;
  onAnswer: (choice: AnswerIndex) => void;
}) {
  const left = useCountdown(q.endsAt);
  return (
    <section className="flex flex-1 flex-col gap-3 p-3">
      <p className="text-center text-lg font-bold">
        {q.index + 1}번 문제 · {left}초
      </p>
      {q.choiceCount === 2 ? (
        // O/X 문제: 큼직한 버튼 2개
        <div className="grid flex-1 grid-cols-2 gap-3">
          {([0, 1] as const).map((i) => (
            <AnswerButton key={i} kind="ox" index={i} onClick={() => onAnswer(i)} />
          ))}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-3">
          {([0, 1, 2, 3] as const).map((i) => (
            <AnswerButton key={i} index={i} onClick={() => onAnswer(i)} />
          ))}
        </div>
      )}
    </section>
  );
}

function Center({ title, subtitle, avatar, children }: { title: string; subtitle?: string; avatar?: ReactNode; children?: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
      {avatar}
      <p className="text-3xl font-black">{title}</p>
      {subtitle && <p className="mt-2 text-lg text-mist">{subtitle}</p>}
      {children}
    </section>
  );
}
