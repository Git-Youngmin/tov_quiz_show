import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Character, RankEntry } from "@tob/shared";
import { sound } from "../audio/ClassicalBgmEngine.ts";
import { FINALE, finaleSchedule } from "../lib/finale.ts";
import { CharacterAvatar, type Mood } from "./CharacterAvatar.tsx";
import { Confetti } from "./Confetti.tsx";
import { Leaderboard } from "./Leaderboard.tsx";

/** 시상식 진행자 */
const MC: Character = { shape: "rabbit", color: "purple" };

const MEDAL = ["🥇", "🥈", "🥉"];
const PLACE_NAME = ["1등", "2등", "3등"];
/** 위치별(0 = 1등, 1 = 2등, 2 = 3등): 무대 위 가로 중심(%), 시상대 높이(%), 캐릭터 폭(cqw) */
const COL_X = [50, 31, 69];
const PED_H = [21, 15, 10.5];
const CHAR_W = [14, 11.5, 10.5];
const COL_W = 15; // 시상대 폭 (%)
const PED_BOTTOM = 24; // 시상대가 서 있는 높이 (%) — 아래 14% 는 이름표와 자막 자리
const CEREMONY = ["cer-1", "cer-2", "cer-3"];
const CHAR_MOOD: Mood[] = ["cheer", "cheer", "happy"];
const PEDESTAL_BG = [
  "linear-gradient(180deg, #f8dd92, #b08d57)",
  "linear-gradient(180deg, #edf0f7, #9aa6bd)",
  "linear-gradient(180deg, #e6ac7a, #9a6334)",
];
const SPARKS = [
  { left: "-8%", top: "10%", delay: "0s" },
  { left: "92%", top: "4%", delay: "0.4s" },
  { left: "100%", top: "50%", delay: "0.9s" },
  { left: "-16%", top: "56%", delay: "1.2s" },
  { left: "46%", top: "-10%", delay: "0.7s" },
];
/** 북소리처럼 점점 빨라지는 똑딱 (뜸 들이기 시작 후 ms) */
const DRUMROLL = [0, 450, 900, 1300, 1650, 1950, 2200, 2400, 2580, 2740, 2870];

/** 카메라: (px, py) 는 화면 중앙에 맞출 무대 위의 점(%), s 는 확대, r 은 기울기(도), ms 는 이동 시간 */
interface Cam {
  px: number;
  py: number;
  s: number;
  r: number;
  ms: number;
}
const wide = (s = 1, ms = 1400): Cam => ({ px: 50, py: 50, s, r: 0, ms });
/** 시상대 + 캐릭터 + 이름표가 한 화면에 들어오도록 초점을 정한다 (1등은 극적인 줌이라 캐릭터 위주) */
const FOCUS: Cam[] = [
  { px: 50, py: 42, s: 1.9, r: 0, ms: 600 }, // 1등
  { px: 31, py: 60, s: 1.6, r: 0, ms: 1100 }, // 2등
  { px: 69, py: 61, s: 1.6, r: 0, ms: 1100 }, // 3등
];
const MC_CLOSE: Cam = { px: 12, py: 58, s: 1.75, r: 0, ms: 1500 };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** 무대 위의 한 점을 화면 중앙으로 가져오는 변환 (확대해도 무대 바깥이 보이지 않게 이동량을 제한) */
function camTransform(c: Cam): string {
  const lim = (c.s - 1) * 50;
  const tx = clamp(-c.s * (c.px - 50), -lim, lim);
  const ty = clamp(-c.s * (c.py - 50), -lim, lim);
  return `translate(${tx}%, ${ty}%) scale(${c.s}) rotate(${c.r}deg)`;
}

/**
 * 최종 순위 발표 — 아카데미 시상식 스타일.
 *   커튼이 열리고 → 진행자가 인사 → 3등, 2등을 차례로 호명(카메라가 해당 시상대로 줌인) →
 *   "그리고 1등은…?!" 봉투와 북소리로 뜸 들이기 → 1등 호명(번쩍 + 극적인 줌 + 색종이) → 나머지 순위
 * 등장한 캐릭터는 등수에 맞는 세레머니를 알아서 반복한다. 시간표는 폰과 같은 lib/finale.ts 를 쓴다.
 */
export function FinalCeremony({ ranking, onExit }: { ranking: RankEntry[]; onExit: () => void }) {
  const top = ranking.slice(0, 3);
  const m = top.length;
  const sched = useMemo(() => finaleSchedule(m), [m]);

  const [cam, setCam] = useState<Cam>(wide(1, 0));
  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [spot, setSpot] = useState<"off" | "on" | "sweep">("off");
  const [line, setLine] = useState<string | null>(null);
  const [mcMood, setMcMood] = useState<Mood>("idle");
  const [envelope, setEnvelope] = useState(false);
  const [suspense, setSuspense] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [burst, setBurst] = useState(false);
  const [flash, setFlash] = useState(0);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const ids = timers.current;
    const at = (t: number, fn: () => void) => ids.push(window.setTimeout(fn, t));
    const reveal = (pos: number) => {
      setRevealed((r) => (r.includes(pos) ? r : [...r, pos]));
      sound.playCorrect();
    };

    at(0, () => setCam(wide(1, 0)));
    at(300, () => {
      setCurtainsOpen(true);
      setCam(wide(1.12, 3000)); // 커튼이 열리는 동안 천천히 다가감
    });
    at(2500, () => {
      setSpot("on");
      setMcMood("wave");
      setLine("🎙️ 신사 숙녀 여러분, 지금부터 최종 순위를 발표하겠습니다!");
      setCam(MC_CLOSE); // 진행자 클로즈업
    });

    // 3등, 2등 호명 (있는 자리만)
    ([2, 1] as const).forEach((pos) => {
      const t = sched.at[pos];
      if (pos >= m || t == null) return;
      at(t - FINALE.pre, () => {
        setMcMood("idle");
        setLine(pos === 2 ? "먼저 3등부터 호명하겠습니다… 🥁" : m >= 3 ? "이어서 2등입니다… 🥁" : "먼저 2등부터 호명하겠습니다… 🥁");
        setCam(wide(1.12, 1300));
      });
      at(t, () => {
        reveal(pos);
        setMcMood("cheer");
        setLine(`${MEDAL[pos]} ${PLACE_NAME[pos]}  ${top[pos].nickname} — 축하합니다!`);
        setCam(FOCUS[pos]);
      });
    });

    // "그리고 1등은…?!"
    if (m >= 2) {
      at(sched.suspenseAt - FINALE.pre, () => {
        setMcMood("idle");
        setLine("그럼 마지막으로… 🥁");
        setCam(wide(1.12, 1300));
      });
    }
    at(sched.suspenseAt, () => {
      setSuspense(true);
      setEnvelope(true);
      setSpot("sweep");
      setLine("🎙️ 그리고 오늘의 1등은…?!");
      setCam({ px: 50, py: 52, s: 1.4, r: -3, ms: 3000 }); // 천천히 밀고 들어가며 살짝 기울임
    });
    DRUMROLL.forEach((o) => at(sched.suspenseAt + o, () => sound.playTick()));

    // 1등 호명
    at(sched.at[0], () => {
      reveal(0);
      setSuspense(false);
      setEnvelope(false);
      setBurst(true);
      setFlash((f) => f + 1);
      setSpot("on");
      setMcMood("cheer");
      setLine(`🏆 1등  ${top[0].nickname} — 진심으로 축하합니다!`);
      setCam(FOCUS[0]); // 번쩍 하며 극적인 줌인
    });
    at(sched.at[0] + 1700, () => setCam({ px: 50, py: 50, s: 1.3, r: 0, ms: 1800 }));
    at(sched.end, () => {
      setCam(wide(1, 2200)); // 크레인처럼 물러나며 전체 무대
      setLine("🎊 오늘 함께한 모든 분께 박수를 부탁드립니다!");
      setDone(true);
    });

    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [sched, m]); // eslint-disable-line react-hooks/exhaustive-deps -- top 은 결과 화면에서 바뀌지 않는다

  /** 건너뛰기: 연출 없이 최종 상태로 */
  const skipAll = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    setCurtainsOpen(true);
    setRevealed(top.map((_, i) => i));
    setSuspense(false);
    setEnvelope(false);
    setBurst(true);
    setSpot("on");
    setMcMood("cheer");
    setLine("🎊 오늘 함께한 모든 분께 박수를 부탁드립니다!");
    setCam(wide(1, 800));
    setDone(true);
  };

  return (
    <section className="relative flex flex-1 flex-col items-center gap-4 px-4 py-4 text-center">
      {burst && <Confetti count={90} />}
      {flash > 0 && <div key={flash} className="finale__flash" aria-hidden />}

      <div className="stage" style={{ width: "min(100%, calc((100dvh - 12.5rem) * 16 / 9))", aspectRatio: "16 / 9" }}>
        {/* ── 카메라가 비추는 무대 ── */}
        <div className="stage__world" style={{ transform: camTransform(cam), "--cam-ms": `${cam.ms}ms` } as CSSProperties}>
          <div className="stage__wall" />
          <div className={`stage__spot stage__spot--l ${spot === "on" ? "stage__spot--on" : spot === "sweep" ? "stage__spot--sweep" : ""}`} />
          <div className={`stage__spot stage__spot--r ${spot === "on" ? "stage__spot--on" : spot === "sweep" ? "stage__spot--sweep" : ""}`} />
          <div className="stage__floor" />
          {burst && <div className="finale__rays" style={{ top: "40%" }} aria-hidden />}

          {/* 시상대 · 이름표 · 캐릭터 */}
          {[1, 0, 2]
            .filter((pos) => pos < m)
            .map((pos) => {
              const e = top[pos];
              const shown = revealed.includes(pos);
              return (
                <div key={pos}>
                  <div className="absolute" style={{ left: `${COL_X[pos]}%`, bottom: `${PED_BOTTOM}%`, width: `${COL_W}%`, height: `${PED_H[pos]}%`, transform: "translateX(-50%)" }}>
                    <div
                      className={`grid h-full w-full place-items-center rounded-t-[1.2cqw] ${shown ? "pedestal-rise shadow-[0_-0.6cqw_3cqw_rgba(0,0,0,0.4)]" : "border-[0.2cqw] border-dashed border-white/25"}`}
                      style={{ background: shown ? PEDESTAL_BG[pos] : undefined }}
                    >
                      <span className={`font-serif-kr font-black ${shown ? "text-navy-950/80" : "text-white/25"}`} style={{ fontSize: "4.4cqw" }}>
                        {shown ? (MEDAL[e.rank - 1] ?? e.rank) : pos + 1}
                      </span>
                    </div>
                  </div>

                  <div className="absolute flex flex-col items-center justify-end" style={{ left: `${COL_X[pos]}%`, bottom: `${PED_BOTTOM + PED_H[pos]}%`, width: `${CHAR_W[pos]}cqw`, transform: "translateX(-50%)" }}>
                    {shown ? (
                      <div className="char-drop relative w-full">
                        {pos === 0 &&
                          SPARKS.map((s, i) => (
                            <span key={i} className="finale__spark" style={{ left: s.left, top: s.top, animationDelay: s.delay }} aria-hidden>
                              ✨
                            </span>
                          ))}
                        <div className={CEREMONY[pos]}>
                          <div className="relative">
                            {pos === 0 && (
                              <span className="crown-drop absolute left-1/2 z-10 -translate-x-1/2" style={{ top: "-9%", fontSize: "5cqw", animationDelay: "1s" }} aria-hidden>
                                👑
                              </span>
                            )}
                            <CharacterAvatar character={e.character} size={100} mood={CHAR_MOOD[pos]} seed={e.playerId} className="h-auto w-full" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span
                        className={`font-black ${pos === 0 && suspense ? "finale__suspense text-gold-300" : "text-white/20"}`}
                        style={{ fontSize: "9cqw", lineHeight: 1 }}
                        aria-hidden
                      >
                        ?
                      </span>
                    )}
                  </div>

                  {shown && (
                    <div
                      className="animate-rise absolute rounded-[0.9cqw] border-[0.15cqw] border-gold-300/60 bg-navy-950/85 px-[1cqw] py-[0.5cqw]"
                      style={{ left: `${COL_X[pos]}%`, bottom: "13.6%", width: "17%", marginLeft: "-8.5%", animationDelay: "0.9s" }}
                    >
                      <p className="truncate font-extrabold" style={{ fontSize: "2cqw" }}>
                        {e.nickname}
                      </p>
                      <p className="font-mono text-gold-200" style={{ fontSize: "1.4cqw" }}>
                        {e.score.toLocaleString()}점
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

          {/* 진행자 + 연단 */}
          <div className="absolute" style={{ left: "3%", bottom: `${PED_BOTTOM - 1}%`, width: "17%" }}>
            <div className="relative mx-auto" style={{ width: "11cqw" }}>
              <span className="absolute left-1/2 z-10 -translate-x-1/2" style={{ top: "-4%", fontSize: "3.6cqw" }} aria-hidden>
                🎩
              </span>
              <CharacterAvatar character={MC} size={100} mood={mcMood} seed="mc" className="h-auto w-full" />
              <span className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "20%", fontSize: "2.6cqw" }} aria-hidden>
                🎀
              </span>
            </div>
            <div className="stage__lectern relative -mt-[5.4cqw] flex items-start justify-center rounded-t-[0.8cqw]" style={{ height: "6.6cqw" }}>
              <span style={{ fontSize: "2.8cqw", marginTop: "-1.6cqw" }} aria-hidden>
                🎤
              </span>
            </div>
          </div>
          {envelope && (
            <span className="finale__suspense absolute" style={{ left: "19%", bottom: "42%", fontSize: "6cqw" }} aria-hidden>
              ✉️
            </span>
          )}

          {/* 커튼 */}
          <div className={`stage__curtain stage__curtain--l ${curtainsOpen ? "stage__curtain--open" : ""}`} />
          <div className={`stage__curtain stage__curtain--r ${curtainsOpen ? "stage__curtain--open" : ""}`} />
          <div className="stage__valance" />
        </div>

        {/* ── 카메라와 상관없이 항상 읽히는 자막 + 나머지 순위 ── */}
        {line && (
          <div key={line} className="stage__subtitle">
            <div className="shrink-0" style={{ width: "4.4cqw" }}>
              <CharacterAvatar character={MC} size={100} bust mood={mcMood === "cheer" ? "cheer" : "idle"} seed="mc2" className="h-auto w-full" />
            </div>
            <p className="min-w-0 flex-1 text-left font-bold" style={{ fontSize: "2.3cqw" }} role="status">
              {line}
            </p>
          </div>
        )}
        {done && ranking.length > 3 && (
          <aside className="animate-rise absolute z-30 rounded-2xl border border-gold-300/50 bg-navy-950/90 p-3 text-left" style={{ right: "2.5%", top: "11%", width: "25%" }}>
            <p className="mb-2 text-sm font-bold text-gold-200">그 밖의 순위</p>
            <Leaderboard entries={ranking.slice(3, 10)} />
          </aside>
        )}
      </div>

      {done ? (
        <button onClick={onExit} className="btn-gold animate-rise rounded-2xl px-8 py-3 text-xl font-black">
          다른 퀴즈 진행하기
        </button>
      ) : (
        <button onClick={skipAll} className="fixed right-6 bottom-6 z-50 rounded-full bg-white/10 px-4 py-2 text-sm text-mist hover:bg-white/20">
          건너뛰기 ⏭
        </button>
      )}
    </section>
  );
}
