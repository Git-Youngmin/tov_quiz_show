import { Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.tsx";
import HostPage from "./pages/HostPage.tsx";
import PlayPage from "./pages/PlayPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/host" element={<HostPage />} />
      <Route path="/play" element={<PlayPage />} />
      <Route
        path="*"
        element={
          <main className="grid h-full place-items-center text-center">
            <div>
              <p className="text-2xl font-bold">페이지를 찾을 수 없어요</p>
              <Link to="/" className="mt-4 inline-block underline">
                처음으로
              </Link>
            </div>
          </main>
        }
      />
    </Routes>
  );
}
