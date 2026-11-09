import { Link } from "react-router-dom";
import { CHARACTER_COLORS, CHARACTER_SHAPES, type Character } from "@tob/shared";
import { CharacterAvatar, type Mood } from "../components/CharacterAvatar.tsx";

/** 홈 화면 무대에 서 있는 친구들 (카훗풍 20종 캐릭터 중 대표 멤버들) */
const CAST: { character: Character; mood: Mood; size: number }[] = [
  { character: { shape: "bear", color: "yellow" }, mood: "idle", size: 114 },
  { character: { shape: "rabbit", color: "blue" }, mood: "wave", size: 128 },
  { character: { shape: "cat", color: "orange" }, mood: "cheer", size: 124 },
  { character: { shape: "puppy", color: "red" }, mood: "idle", size: 130 },
  { character: { shape: "dino", color: "green" }, mood: "cheer", size: 122 },
  { character: { shape: "panda", color: "purple" }, mood: "wave", size: 116 },
];

const STEPS = [
  { n: "01", title: "스크린에 PIN · QR", body: "PLAY 를 누르면 큰 화면에 QR 코드와 6자리 PIN 이 떠요. 친구들은 QR 을 찍기만 하면 돼요." },
  { n: "02", title: "내 캐릭터 고르기", body: "스마트폰으로 접속해서 닉네임을 쓰고, 20여 종의 귀여운 동물·크리처 캐릭터로 나만의 친구를 만들어요." },
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
        <section className="relative pt-6 text-center sm:pt-12">
          {/* 럭셔리 Pill 배지 */}
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-gold-200 backdrop-blur-md shadow-[0_0_24px_rgba(226,200,152,0.18)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-300"></span>
            </span>
            REAL-TIME INTERACTIVE QUIZ
          </div>

          {/* 화려하고 고급스러운 반짝이는 TOV QUIZ 타이포그래피 (Otter-bot 레퍼런스 스타일) */}
          <div className="relative mx-auto mt-5 max-w-3xl select-none" style={{ animationDelay: "0.08s" }}>
            {/* 반짝이는 별 파티클 ✨ */}
            <svg
              className="tov-sparkle left-[6%] sm:left-[14%] -top-3 w-7 h-7 text-gold-200"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            <svg
              className="tov-sparkle right-[4%] sm:right-[12%] top-1 w-9 h-9 text-gold-300"
              style={{ animationDelay: "1.3s" }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
            <svg
              className="tov-sparkle left-[24%] -bottom-2 w-5 h-5 text-pink-300"
              style={{ animationDelay: "0.7s" }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>

            <h1 className="animate-rise tov-hero-title text-6xl leading-[1.08] font-black tracking-tight sm:text-8xl md:text-9xl">
              TOV QUIZ
            </h1>
          </div>

          <p className="animate-rise mx-auto mt-6 max-w-lg text-base sm:text-xl font-medium leading-relaxed text-mist" style={{ animationDelay: "0.16s" }}>
            대답만 하는 퀴즈 말고, 모두가 열광하는 실시간 퀴즈쇼.<br className="hidden sm:inline" />
            스크린은 보고, 스마트폰으로는 누르고!
          </p>
        </section>

        {/* 무대: 활기차게 움직이는 캐릭터 친구들 */}
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
            귀여운 캐릭터 {CHARACTER_SHAPES.length}가지 × 색상 {CHARACTER_COLORS.length}가지, 모두 {CHARACTER_SHAPES.length * CHARACTER_COLORS.length}종류
          </p>
          <div className="glass mt-8 grid grid-cols-4 gap-x-2 gap-y-6 rounded-3xl p-6 sm:grid-cols-6 max-h-96 overflow-y-auto">
            {CHARACTER_SHAPES.flatMap((shape, si) =>
              CHARACTER_COLORS.map((color, ci) => (
                <CharacterAvatar key={`${shape}${color}`} character={{ shape, color }} size={56} seed={si * 10 + ci} className="mx-auto" />
              )),
            )}
          </div>
        </section>
      </main>

      <footer className="mt-24 py-10 text-center text-sm text-mist/70">경원교회 중고등부 토브 · TOV QUIZ SHOW</footer>
    </div>
  );
}
