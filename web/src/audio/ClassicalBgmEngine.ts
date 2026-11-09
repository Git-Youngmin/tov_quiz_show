/**
 * 토브 퀴즈쇼 BGM & 효과음 엔진
 *
 * BGM 은 Kevin MacLeod (incompetech.com) 의 곡이며 CC BY 4.0 라이선스입니다 → 출처 표기가 필요해서
 * 곡 정보와 표기 문구는 ./credits.ts 에 모아 두고 화면(MusicCredit)과 public/audio/CREDITS.md 에 싣습니다.
 *   lobby       Pleasant Porridge  (로비 라운지 느낌의 일렉트릭 피아노 그루브)
 *   playing     Loopster           (문제 읽는 데 방해가 안 되는 미니멀 그루브)
 *   leaderboard Funky Chunk        (점수판 줄이 움직일 때 어울리는 깔끔한 펑크)
 *   finished    Heroic Age         (시상식 팡파르)
 * 파일은 원곡에서 앞뒤 무음을 잘라내고 음량을 -18 LUFS 로 맞췄으며, 반복 재생 때 끊기지 않게 짧은 페이드를 넣었습니다.
 * 곡을 바꿀 때는 같은 이름으로 public/audio/bgm_*.mp3 를 덮어쓰고 credits.ts 도 함께 고치세요.
 */

export type BgmTrack = "lobby" | "playing" | "leaderboard" | "finished" | "off";

const TRACK_PATHS: Record<Exclude<BgmTrack, "off">, string> = {
  lobby: "/audio/bgm_lobby.mp3",
  playing: "/audio/bgm_playing.mp3",
  leaderboard: "/audio/bgm_leaderboard.mp3",
  finished: "/audio/bgm_finished.mp3",
};

class MapleBgmAudioEngine {
  private currentTrack: BgmTrack = "off";
  private activeAudio: HTMLAudioElement | null = null;
  private fadingAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private audioCache = new Map<string, HTMLAudioElement>();
  private sfxCtx: AudioContext | null = null;

  constructor() {
    try {
      const savedMute = localStorage.getItem("tov_bgm_muted");
      if (savedMute !== null) this.isMuted = savedMute === "true";
      const savedVol = localStorage.getItem("tov_bgm_vol");
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch {
      // ignore
    }

    if (typeof window !== "undefined") {
      const unlock = () => {
        if (this.sfxCtx && this.sfxCtx.state === "suspended") {
          void this.sfxCtx.resume();
        }
        if (this.activeAudio && !this.isMuted && this.activeAudio.paused && this.currentTrack !== "off") {
          this.activeAudio.play().catch(() => {});
        }
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      };
      window.addEventListener("pointerdown", unlock, { once: false, passive: true });
      window.addEventListener("keydown", unlock, { once: false, passive: true });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("tov_bgm_muted", String(this.isMuted));
    } catch {}

    if (this.activeAudio) {
      this.activeAudio.muted = this.isMuted;
      if (!this.isMuted && this.currentTrack !== "off") {
        this.activeAudio.play().catch(() => {});
      }
    }
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem("tov_bgm_vol", String(this.volume));
    } catch {}

    if (this.activeAudio) {
      this.activeAudio.volume = this.volume;
    }
  }

  /**
   * 화면 상태에 따른 BGM 전환 (부드러운 크로스페이드)
   */
  public setTrack(track: BgmTrack) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;

    if (track === "off") {
      this.stopCurrent();
      return;
    }

    const src = TRACK_PATHS[track];
    if (!src) return;

    this.fadeOutPrevious();

    let nextAudio = this.audioCache.get(src);
    if (!nextAudio) {
      nextAudio = new Audio(src);
      nextAudio.loop = true;
      nextAudio.preload = "auto";
      this.audioCache.set(src, nextAudio);
    } else {
      nextAudio.currentTime = 0;
    }

    nextAudio.volume = this.isMuted ? 0 : this.volume;
    nextAudio.muted = this.isMuted;
    this.activeAudio = nextAudio;

    const playPromise = nextAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 자동 재생 차단 시 첫 클릭에서 자동 언락됨
      });
    }
  }

  private fadeOutPrevious() {
    if (!this.activeAudio) return;
    const prev = this.activeAudio;
    this.fadingAudio = prev;

    const startVol = prev.volume;
    const fadeSteps = 10;
    const stepTime = 40;
    let step = 0;

    const fadeTimer = setInterval(() => {
      step++;
      if (step >= fadeSteps || prev !== this.fadingAudio) {
        clearInterval(fadeTimer);
        prev.pause();
        prev.volume = startVol;
        if (this.fadingAudio === prev) this.fadingAudio = null;
      } else {
        prev.volume = Math.max(0, startVol * (1 - step / fadeSteps));
      }
    }, stepTime);
  }

  private stopCurrent() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
  }

  // ───────────────────────── 효과음 (SFX) ─────────────────────────

  private initSfx() {
    if (!this.sfxCtx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.sfxCtx = new AudioCtx();
    }
    if (this.sfxCtx && this.sfxCtx.state === "suspended") {
      void this.sfxCtx.resume();
    }
  }

  /** 카운트다운 째깍 소리 (깔끔한 우드블록 틱) */
  public playTick() {
    if (this.isMuted) return;
    try {
      this.initSfx();
      if (!this.sfxCtx) return;

      const now = this.sfxCtx.currentTime;
      const osc = this.sfxCtx.createOscillator();
      const gain = this.sfxCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.035);

      gain.gain.setValueAtTime(0.28 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.sfxCtx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /** 정답 효과음 (메이플 퀘스트 완료 / 레벨업 스타일 스튜디오 차임) */
  public playCorrect() {
    if (this.isMuted) return;
    try {
      const sfx = new Audio("/audio/sfx_correct.mp3");
      sfx.volume = Math.min(1, this.volume * 0.95);
      sfx.play().catch(() => {});
    } catch {}
  }

  /** 오답 효과음 (따뜻한 로즈 피아노 & 클라리넷 화음) */
  public playWrong() {
    if (this.isMuted) return;
    try {
      const sfx = new Audio("/audio/sfx_wrong.mp3");
      sfx.volume = Math.min(1, this.volume * 0.85);
      sfx.play().catch(() => {});
    } catch {}
  }
}

export const sound = new MapleBgmAudioEngine();
