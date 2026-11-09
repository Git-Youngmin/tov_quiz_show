import { Link } from "react-router-dom";

/** 메인 화면: TOV QUIZ 타이틀 + 버튼 2개(문제 만들기 / PLAY)만 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-12 px-5 py-10">
      <div className="relative w-full text-center">
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
      </div>

      <section className="grid w-full gap-4 sm:grid-cols-2">
        <Link to="/host/quizzes" className="glass animate-rise rounded-3xl p-8 text-center transition hover:bg-white/15" style={{ animationDelay: "0.3s" }}>
          <span className="block text-3xl" aria-hidden>
            ✏️
          </span>
          <span className="mt-2 block text-2xl font-extrabold">문제 만들기</span>
        </Link>
        {/* PLAY = 스크린에 띄우는 진행 화면. 참가자는 여기를 거치지 않고 QR 로 바로 입장한다 */}
        <Link to="/host" className="btn-gold animate-rise order-first rounded-3xl p-8 text-center sm:order-none" style={{ animationDelay: "0.24s" }}>
          <span className="block text-3xl" aria-hidden>
            🎮
          </span>
          <span className="mt-2 block text-2xl font-extrabold tracking-wider">PLAY</span>
        </Link>
      </section>
    </main>
  );
}
