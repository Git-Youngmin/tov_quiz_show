import { Link } from "react-router-dom";

/** 메인 화면 (투트랙): 진행하기 / 참가하기 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-10 px-4 py-12">
      <header className="text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl">토브 퀴즈쇼</h1>
        <p className="mt-3 text-violet-200">Tob Quiz Show · 함께 푸는 실시간 퀴즈</p>
      </header>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link
          to="/host"
          className="rounded-3xl bg-white/10 p-8 text-center ring-1 ring-white/20 transition hover:bg-white/20"
        >
          <span className="block text-4xl" aria-hidden>
            🎤
          </span>
          <span className="mt-3 block text-2xl font-bold">진행하기</span>
          <span className="mt-1 block text-sm text-violet-200">출제자용 · 스크린에 띄우기</span>
        </Link>
        <Link
          to="/play"
          className="rounded-3xl bg-amber-400 p-8 text-center text-violet-950 shadow-lg transition hover:bg-amber-300"
        >
          <span className="block text-4xl" aria-hidden>
            📱
          </span>
          <span className="mt-3 block text-2xl font-bold">참가하기</span>
          <span className="mt-1 block text-sm text-violet-900">실전용 · PIN 입력</span>
        </Link>
      </div>
    </main>
  );
}
