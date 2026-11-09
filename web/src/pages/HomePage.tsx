import { Link } from "react-router-dom";
import { CHARACTER_COLORS, CHARACTER_SHAPES, type Character } from "@tob/shared";
import { CharacterAvatar, type Mood } from "../components/CharacterAvatar.tsx";

/** 홈 화면 무대에 서 있는 친구들 (모양 4 × 색 6 중 골라서) */
const CAST: { character: Character; mood: Mood; size: number }[] = [
  { character: { shape: "sphere", color: "yellow" }, mood: "idle", size: 109 },
  { character: { shape: "capsule", color: "blue" }, mood: "wave", size: 130 },
  { character: { shape: "cone", color: "purple" }, mood: "cheer", size: 120 },
  { character: { shape: "box", color: "red" }, mood: "idle", size: 135 },
  { character: { shape: "capsule", color: "green" }, mood: "sleepy", size: 117 },
  { character: { shape: "sphere", color: "orange" }, mood: "wave", size: 112 },
];

const STEPS = [
  { n: "01", title: "스크린에 PIN · QR", body: "PLAY 를 누르면 큰 화면에 QR 코드와 6자리 PIN 이 떠요. 친구들은 QR 을 찍기만 하면 돼요." },
  { n: "02", title: "내 캐릭터 고르기", body: "스마트폰으로 접속해서 닉네임을 쓰고, 모양 4가지 · 색 6가지로 나만의 친구를 만들어요." },
  { n: "03", title: "큼직한 버튼으로 정답!", body: "문제는 스크린에, 폰에는 큰 버튼만. 빨리 맞힐수록 점수가 높고 연속 정답은 보너스예요." },
];

/** 메인 화면 (투트랙): 문제 만들기 / PLAY */
export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5">
      <header className="flex items-center justify-between py-6">
        <div className="leading-tight">
          <small className="block text-[11px] tracking-[0.2em] text-mist">경원교회 중고등부</small>
          <strong className="text-2xl font-extrabold tracking-[0.12em]">토브</strong>
        </div>
      </header>

      <main className="flex-1">
        <section className="pt-8 text-center sm:pt-14">
          <p className="animate-rise text-sm tracking-[0.3em] text-gold-300">TOB QUIZ SHOW</p>
          <h1 className="animate-rise font-serif-kr mt-4 text-4xl leading-[1.35] font-extrabold sm:text-6xl" style={{ animationDelay: "0.08s" }}>
            함께 풀고,
            <br />
            함께 웃는 <span className="text-gold-300">토브 퀴즈쇼</span>
          </h1>
          <p className="animate-rise mx-auto mt-5 max-w-md text-mist" style={{ animationDelay: "0.16s" }}>
            스크린은 보고, 스마트폰으로는 누르고. 우리 모두의 실시간 퀴즈 시간이에요.
          </p>
        </section>

        {/* 무대 */}
        <section aria-label="캐릭터 친구들" className="relative mt-10 sm:mt-14">
          <div className="flex items-end justify-center gap-1 sm:gap-4">
            {CAST.map((c, i) => (
              <CharacterAvatar key={i} character={c.character} mood={c.mood} seed={i * 7 + 3} size={c.size} popIn className="max-w-[17vw]" />
            ))}
          </div>
          <div className="mx-auto -mt-1 h-px max-w-3xl bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <Link to="/host/quizzes" className="glass animate-rise rounded-3xl p-7 text-center transition hover:bg-white/15" style={{ animationDelay: "0.3s" }}>
            <span className="block text-3xl" aria-hidden>
              ✏️
            </span>
            <span className="mt-2 block text-2xl font-extrabold">문제 만들기</span>
            <span className="mt-1 block text-sm text-mist">퀴즈를 만들고 고쳐요 · 단톡방 글 붙여넣기도 OK</span>
          </Link>
          {/* PLAY = 스크린에 띄우는 진행 화면. 참가자는 여기를 거치지 않고 QR 로 바로 입장한다 */}
          <Link to="/host" className="btn-gold animate-rise order-first rounded-3xl p-7 text-center sm:order-none" style={{ animationDelay: "0.24s" }}>
            <span className="block text-3xl" aria-hidden>
              🎮
            </span>
            <span className="mt-2 block text-2xl font-extrabold tracking-wider">PLAY</span>
            <span className="mt-1 block text-sm opacity-75">스크린에 띄우면 QR · PIN 으로 친구들이 입장해요</span>
          </Link>
        </section>

        <section className="mt-24" aria-labelledby="how">
          <h2 id="how" className="font-serif-kr text-center text-3xl font-extrabold">
            이렇게 진행돼요
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="glass rounded-3xl p-6">
                <span className="font-serif-kr text-3xl font-extrabold text-gold-300">{s.n}</span>
                <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-24 text-center" aria-labelledby="friends">
          <h2 id="friends" className="font-serif-kr text-3xl font-extrabold">
            나만의 친구를 골라요
          </h2>
          <p className="mt-2 text-mist">
            모양 {CHARACTER_SHAPES.length}가지 × 색 {CHARACTER_COLORS.length}가지, 모두 {CHARACTER_SHAPES.length * CHARACTER_COLORS.length}마리
          </p>
          <div className="glass mt-8 grid grid-cols-4 gap-x-2 gap-y-6 rounded-3xl p-6 sm:grid-cols-6">
            {CHARACTER_SHAPES.flatMap((shape, si) =>
              CHARACTER_COLORS.map((color, ci) => (
                <CharacterAvatar key={`${shape}${color}`} character={{ shape, color }} size={56} seed={si * 10 + ci} className="mx-auto" />
              )),
            )}
          </div>
        </section>
      </main>

      <footer className="mt-24 py-10 text-center text-sm text-mist/70">경원교회 중고등부 토브 · Tob Quiz Show</footer>
    </div>
  );
}
