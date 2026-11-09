/**
 * 토브 퀴즈쇼 전용 정통 클래식 심포니 BGM & SFX 엔진
 *
 * 🎻 수록곡 (저작권 만료 퍼블릭 도메인 / 오케스트라 실연 레코딩):
 *   - lobby(로비/홈): 비발디 사계 중 봄 1악장 알레그로 (Vivaldi - Spring 1. Allegro)
 *     * 밝고 우아하며 활기찬 스트링 솔로와 합주
 *   - playing(문제 풀이): 비발디 사계 중 여름 3악장 프레스토 (Vivaldi - Summer 3. Presto)
 *     * 긴박하고 폭풍처럼 휘몰아치는 바이올린 초절기교 속주 (퀴즈 긴장감 극대화)
 *   - leaderboard(순위 발표): 브람스 헝가리 무곡 5번 (Brahms - Hungarian Dance No. 5)
 *     * 리드미컬하고 세련되며 드라마틱한 관현악
 *   - finished(최종 결과/시상식): 오펜바흐 천국과 지옥 중 캉캉 (Offenbach - Can-Can / Galop Infernal)
 *     * 신나고 폭발적인 축제 분위기
 */

export type BgmTrack = "lobby" | "playing" | "leaderboard" | "finished" | "off";

const TRACK_PATHS: Record<Exclude<BgmTrack, "off">, string> = {
  lobby: "/audio/bgm_lobby.mp3",
  playing: "/audio/bgm_playing.mp3",
  leaderboard: "/audio/bgm_leaderboard.mp3",
  finished: "/audio/bgm_finished.mp3",
};

class RealClassicalAudioEngine {
  private currentTrack: BgmTrack = "off";
  private activeAudio: HTMLAudioElement | null = null;
  private fadingAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private audioCache = new Map<string, HTMLAudioElement>();
  private sfxCtx: AudioContext | null = null;

  constructor() {
    // 이전 설정 복원
    try {
      const savedMute = localStorage.getItem("tov_bgm_muted");
      if (savedMute !== null) this.isMuted = savedMute === "true";
      const savedVol = localStorage.getItem("tov_bgm_vol");
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch {
      // ignore
    }

    // 브라우저 자동 재생 정책 해제 리스너 등록
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

    // 이전 재생 중인 오디오 부드럽게 페이드아웃
    this.fadeOutPrevious();

    // 새 오디오 생성 또는 재활용
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
      playPromise.catch((_err) => {
        // 자동 재생 차단된 경우, 다음 사용자 클릭 시 재생 대기
      });
    }
  }

  private fadeOutPrevious() {
    if (!this.activeAudio) return;
    const prev = this.activeAudio;
    this.fadingAudio = prev;

    const startVol = prev.volume;
    const fadeSteps = 10;
    const stepTime = 40; // 0.4초 페이드아웃
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

  /** 카운트다운 째깍 소리 (우드블록 스타일) */
  public playTick() {
    if (this.isMuted) return;
    try {
      this.initSfx();
      if (!this.sfxCtx) return;

      const now = this.sfxCtx.currentTime;
      const osc = this.sfxCtx.createOscillator();
      const gain = this.sfxCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxCtx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /** 정답 효과음 (맑고 화려한 벨 차임 & 상승 3화음) */
  public playCorrect() {
    if (this.isMuted) return;
    try {
      this.initSfx();
      if (!this.sfxCtx) return;

      const now = this.sfxCtx.currentTime;
      // C6, E6, G6, C7 빠른 아르페지오 차임
      const notes = [1046.5, 1318.5, 1567.98, 2093.0];
      notes.forEach((freq, i) => {
        const t = now + i * 0.07;
        const osc = this.sfxCtx!.createOscillator();
        const gain = this.sfxCtx!.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.35 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxCtx!.destination);

        osc.start(t);
        osc.stop(t + 0.36);
      });
    } catch {}
  }

  /** 오답 효과음 (부드러운 단조 피치카토) */
  public playWrong() {
    if (this.isMuted) return;
    try {
      this.initSfx();
      if (!this.sfxCtx) return;

      const now = this.sfxCtx.currentTime;
      const notes = [392.0, 329.6]; // G4 -> E4 하강
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = this.sfxCtx!.createOscillator();
        const gain = this.sfxCtx!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.25 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxCtx!.destination);

        osc.start(t);
        osc.stop(t + 0.26);
      });
    } catch {}
  }
}

export const sound = new RealClassicalAudioEngine();
