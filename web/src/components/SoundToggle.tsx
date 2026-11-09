import { useState, useEffect } from "react";
import { sound } from "../audio/ClassicalBgmEngine.ts";

export function SoundToggle({ className = "" }: { className?: string }) {
  const [muted, setMuted] = useState(sound.getIsMuted());
  const [vol, setVol] = useState(sound.getVolume());
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    // 최초 렌더 시 동기화
    setMuted(sound.getIsMuted());
    setVol(sound.getVolume());
  }, []);

  const handleToggle = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVol(val);
    sound.setVolume(val);
    if (muted && val > 0) {
      sound.toggleMute();
      setMuted(false);
    }
  };

  return (
    <div
      className={`relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md transition hover:bg-white/15 ${className}`}
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs font-bold text-gold-200 outline-none"
        aria-label={muted ? "음악 켜기" : "음악 끄기"}
        title={muted ? "음악 켜기" : "음악 끄기"}
      >
        <span className="text-base leading-none">{muted ? "🔇" : "🎻"}</span>
        <span className="hidden sm:inline">{muted ? "BGM OFF" : "BGM ON"}</span>
      </button>

      {/* 볼륨 슬라이더 */}
      <div className={`flex items-center transition-all duration-200 ${showSlider ? "w-16 opacity-100 ml-1" : "w-0 opacity-0 overflow-hidden"}`}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : vol}
          onChange={handleVol}
          className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-gold-400/40 accent-gold-300 outline-none"
          title="볼륨 조절"
        />
      </div>
    </div>
  );
}
