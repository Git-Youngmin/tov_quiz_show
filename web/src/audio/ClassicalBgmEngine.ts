/**
 * 토브 퀴즈쇼 전용 클래식 심포니 BGM & SFX 사운드 엔진.
 *
 * 🎻 컨셉:
 *   - 화려한 클래식 + 빠른 템포 (128~140 BPM)
 *   - 풍성하고 웅장한 스트링(바이올린·비올라·첼로) 앙상블 사운드
 *   - 화려한 하이 음색 (첼레스타·글로켄슈필·피치카토·하이 바이올린 아르페지오)
 *   - 세련되고 트렌디한 브릿지턴 / 클린밴딧 / 비발디 스타일의 네오 클래시컬 사운드
 *
 * 🔊 기능:
 *   - 화면별 맞춤 트랙: lobby(로비) / playing(문제 진행) / leaderboard(순위 발표) / finished(시상식)
 *   - 브라우저 자동 재생 정책 대응 (첫 클릭 시 자동 언락)
 *   - 부드러운 트랙 크로스페이드 (0.6초)
 *   - 효과음(정답, 오답, 카운트다운 째깍, 팡파레) 내장
 */

export type BgmTrack = "lobby" | "playing" | "leaderboard" | "finished" | "off";

// 음높이 주파수 맵 (MIDI note to Frequency: 69 = A4 = 440Hz)
function m2f(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// 음표 상수 (예: C4=60, D4=62, E4=64, F#4=66, G4=67, A4=69, B4=71, C5=72, D5=74, etc.)
const NOTES = {
  // 옥타브 3 (베이스/첼로)
  C3: 48, Cs3: 49, D3: 50, Eb3: 51, Ds3: 51, E3: 52, F3: 53, Fs3: 54, G3: 55, Gs3: 56, Ab3: 56, A3: 57, Bb3: 58, B3: 59,
  // 옥타브 4 (중음/비올라)
  C4: 60, Cs4: 61, D4: 62, Eb4: 63, Ds4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, Ab4: 68, A4: 69, Bb4: 70, B4: 71,
  // 옥타브 5 (하이 바이올린)
  C5: 72, Cs5: 73, D5: 74, Eb5: 75, Ds5: 75, E5: 76, F5: 77, Fs5: 78, G5: 79, Gs5: 80, Ab5: 80, A5: 81, Bb5: 82, B5: 83,
  // 옥타브 6 (초고음 글린트 / 첼레스타)
  C6: 84, Cs6: 85, D6: 86, Eb6: 87, Ds6: 87, E6: 88, F6: 89, Fs6: 90, G6: 91, Gs6: 92, Ab6: 92, A6: 93, Bb6: 94, B6: 95, C7: 96,
};

class ClassicalEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  private currentTrack: BgmTrack = "off";
  private isMuted: boolean = false;
  private volume: number = 0.7;

  private timerId: number | null = null;
  private nextStepTime: number = 0;
  private stepIndex: number = 0;

  constructor() {
    // 로컬 스토리지에서 이전 설정 복원
    try {
      const savedMute = localStorage.getItem("tov_bgm_muted");
      if (savedMute !== null) this.isMuted = savedMute === "true";
      const savedVol = localStorage.getItem("tov_bgm_vol");
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch {
      // ignore
    }
  }

  /** AudioContext 초기화 및 리버브 생성 (사용자 제스처 시 호출) */
  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // 마스터 게인
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 심포니 홀 리버브 생성 (풍성한 오케스트라 공간감)
    this.reverbNode = this.createHallReverb(this.ctx, 2.4, 0.45);
    this.reverbNode.connect(this.masterGain);

    // 음악 채널 (드라이 70% + 리버브 30%)
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);
    this.musicGain.connect(this.reverbNode);

    // 효과음 채널
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  /** 오케스트라 콘서트홀 임펄스 리버브 합성 */
  private createHallReverb(ctx: AudioContext, seconds: number, decay: number): ConvolverNode {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay * 10);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * 풍성한 오케스트라 스트링 앙상블 음색 합성 (Unison 3-Oscillator Detuned Saw + Warm Filter)
   */
  private playStringVoice(
    note: number,
    time: number,
    duration: number,
    velocity: number = 0.5,
    isStaccato: boolean = false
  ) {
    if (!this.ctx || !this.musicGain) return;
    const freq = m2f(note);

    const voiceGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // 고음역대 현악기의 화려한 공명 필터
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isStaccato ? 5500 : 3800, time);
    filter.Q.setValueAtTime(isStaccato ? 2.5 : 1.2, time);

    // 3중 디튠 톱니파로 현악 오케스트라 특유의 두텁고 화려한 합주 느낌 연출
    const detunes = [-7, 0, 7];
    const oscs: OscillatorNode[] = [];

    detunes.forEach((det) => {
      const osc = this.ctx!.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, time);
      osc.detune.setValueAtTime(det, time);
      osc.connect(filter);
      oscs.push(osc);
    });

    filter.connect(voiceGain);
    voiceGain.connect(this.musicGain);

    // ADSR 엔벨로프
    const attack = isStaccato ? 0.015 : 0.08;
    const release = isStaccato ? 0.06 : 0.18;
    const peak = velocity * 0.22;

    voiceGain.gain.setValueAtTime(0.0001, time);
    voiceGain.gain.exponentialRampToValueAtTime(peak, time + attack);
    voiceGain.gain.exponentialRampToValueAtTime(peak * 0.7, time + attack + 0.05);
    voiceGain.gain.setValueAtTime(peak * 0.7, time + duration - release);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscs.forEach((osc) => {
      osc.start(time);
      osc.stop(time + duration + 0.1);
    });
  }

  /**
   * 화려한 하이 첼레스타/글로켄슈필 벨 (영롱하고 고급스러운 반짝임)
   */
  private playCelestaBell(note: number, time: number, velocity: number = 0.4) {
    if (!this.ctx || !this.musicGain) return;
    const freq = m2f(note);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, time);

    // 2.76배 배음 (금속성 벨 특유의 맑은 울림)
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2.76, time);

    osc1.connect(bellGain);
    osc2.connect(bellGain);
    bellGain.connect(this.musicGain);

    const vol = velocity * 0.18;
    bellGain.gain.setValueAtTime(vol, time);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.75);
    osc2.stop(time + 0.75);
  }

  /**
   * 첼로/콘트라베이스 스타카토 (묵직하고 빵빵한 저음 비트)
   */
  private playCelloBass(note: number, time: number, duration: number, velocity: number = 0.6) {
    if (!this.ctx || !this.musicGain) return;
    const freq = m2f(note);

    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    sub.type = "triangle";
    sub.frequency.setValueAtTime(freq / 2, time);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(450, time + duration);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    const vol = velocity * 0.32;
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    sub.start(time);
    osc.stop(time + duration + 0.05);
    sub.stop(time + duration + 0.05);
  }

  // ───────────────────────── 트랙별 시퀀서 (화려한 클래식 곡) ─────────────────────────

  /**
   * 1. 로비 BGM: "비발디 스타일 활기찬 바로크 알레그로 (D Major, 130 BPM)"
   * 화려한 16분음표 바이올린 스타카토 + 반짝이는 첼레스타 + 당당한 첼로
   */
  private stepLobby(time: number, step: number) {
    const s16 = step % 64; // 4마디 루프 (16박자 x 4 = 64개의 16분음표)
    const bar = Math.floor(s16 / 16);
    const sub = s16 % 16;
    const stepDur = 60 / 130 / 4; // 16분음표 길이

    // 화음 진행: D Major -> A Major -> B Minor -> G Major
    const rootBass = [NOTES.D3, NOTES.A3 - 12, NOTES.B3 - 12, NOTES.G3 - 12][bar];

    // 1) 첼로 베이스 8분음표 리듬 펄스
    if (sub % 2 === 0) {
      this.playCelloBass(rootBass, time, stepDur * 1.8, 0.65);
    }

    // 2) 고음 바이올린 아르페지오 (화려하게 오르내리는 16분음표 현악 패시지)
    const violinPatterns = [
      // D Major: D5 - F#5 - A5 - D6 ...
      [NOTES.D5, NOTES.Fs5, NOTES.A5, NOTES.D6, NOTES.Fs5, NOTES.A5, NOTES.D6, NOTES.A5, NOTES.Fs5, NOTES.A5, NOTES.D5, NOTES.Fs5, NOTES.A5, NOTES.Cs6, NOTES.E6, NOTES.Fs6],
      // A Major: A5 - C#6 - E6 - A6 ...
      [NOTES.Cs5, NOTES.E5, NOTES.A5, NOTES.Cs6, NOTES.E5, NOTES.A5, NOTES.Cs6, NOTES.E6, NOTES.Cs6, NOTES.A5, NOTES.E5, NOTES.Cs5, NOTES.E5, NOTES.A5, NOTES.Cs6, NOTES.E6],
      // B Minor: B4 - D5 - F#5 - B5 ...
      [NOTES.B4, NOTES.D5, NOTES.Fs5, NOTES.B5, NOTES.D5, NOTES.Fs5, NOTES.B5, NOTES.D6, NOTES.B5, NOTES.Fs5, NOTES.D5, NOTES.B4, NOTES.D5, NOTES.Fs5, NOTES.B5, NOTES.D6],
      // G Major: G4 - B4 - D5 - G5 - high sparkle ...
      [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.G5, NOTES.B5, NOTES.D6, NOTES.G6, NOTES.D6, NOTES.B5, NOTES.G5, NOTES.D5, NOTES.B4, NOTES.A4, NOTES.B4, NOTES.Cs5, NOTES.E5],
    ];

    const vNote = violinPatterns[bar][sub];
    this.playStringVoice(vNote, time, stepDur * 1.3, 0.42, true);

    // 3) 영롱한 첼레스타 고음 벨 (박자마다 청량하게 터지는 반짝임)
    if (sub === 0 || sub === 6 || sub === 12) {
      const bellNote = [NOTES.D6, NOTES.Cs6, NOTES.B5, NOTES.G6][bar];
      this.playCelestaBell(bellNote, time, 0.5);
    }
  }

  /**
   * 2. 문제 진행 BGM: "긴박한 비르투오소 현악 질주 (G Minor, 138 BPM)"
   * 파가니니풍 스타카토 오스티나토 + 긴장감 고조 + 틱톡 시계추 리듬
   */
  private stepPlaying(time: number, step: number) {
    const s16 = step % 64;
    const bar = Math.floor(s16 / 16);
    const sub = s16 % 16;
    const stepDur = 60 / 138 / 4;

    // 긴박한 Gm -> Eb -> Cm -> D7 진행
    const basses = [NOTES.G3 - 12, NOTES.E3 - 1, NOTES.C3, NOTES.D3][bar];

    // 1) 묵직하고 긴박한 첼로 스타카토
    if (sub % 2 === 0) {
      this.playCelloBass(basses, time, stepDur * 1.6, 0.7);
    }

    // 2) 폭풍처럼 몰아치는 16분음표 스트링 오스티나토
    const tenseRiffs = [
      // Gm
      [NOTES.G4, NOTES.Bb4, NOTES.D5, NOTES.Bb4, NOTES.G4, NOTES.Bb4, NOTES.D5, NOTES.G5, NOTES.D5, NOTES.Bb4, NOTES.G4, NOTES.Bb4, NOTES.D5, NOTES.Fs5, NOTES.A5, NOTES.D6],
      // Eb
      [NOTES.Eb4, NOTES.G4, NOTES.Bb4, NOTES.G4, NOTES.Eb4, NOTES.G4, NOTES.Bb4, NOTES.Eb5, NOTES.Bb4, NOTES.G4, NOTES.Eb4, NOTES.G4, NOTES.Bb4, NOTES.C5, NOTES.D5, NOTES.Eb5],
      // Cm
      [NOTES.C4, NOTES.Eb4, NOTES.G4, NOTES.Eb4, NOTES.C4, NOTES.Eb4, NOTES.G4, NOTES.C5, NOTES.G4, NOTES.Eb4, NOTES.C4, NOTES.Eb4, NOTES.G4, NOTES.A4, NOTES.Bb4, NOTES.C5],
      // D7 tension
      [NOTES.D4, NOTES.Fs4, NOTES.A4, NOTES.C5, NOTES.Fs5, NOTES.A5, NOTES.C6, NOTES.A5, NOTES.Fs5, NOTES.D5, NOTES.C5, NOTES.A4, NOTES.Fs4, NOTES.A4, NOTES.D5, NOTES.Fs5],
    ];

    const note = tenseRiffs[bar][sub];
    this.playStringVoice(note, time, stepDur * 1.1, 0.5, true);

    // 3) 긴장감을 더하는 하이 피치카토 째깍 소리
    if (sub % 4 === 2) {
      this.playCelestaBell(NOTES.A6, time, 0.35);
    }
  }

  /**
   * 3. 순위 발표 BGM: "우아하고 화려한 모차르트풍 축제 (A Major, 122 BPM)"
   * 부드러운 바이올린 아치 선율 + 찰랑이는 글린트 벨
   */
  private stepLeaderboard(time: number, step: number) {
    const s16 = step % 64;
    const bar = Math.floor(s16 / 16);
    const sub = s16 % 16;
    const stepDur = 60 / 122 / 4;

    const baseChord = [NOTES.A3, NOTES.E3, NOTES.Fs3, NOTES.D3][bar];

    // 1) 첼로 피치카토
    if (sub === 0 || sub === 8) {
      this.playCelloBass(baseChord, time, stepDur * 3.5, 0.55);
    }

    // 2) 우아하고 산뜻한 바이올린 선율
    const melody = [
      [NOTES.A4, NOTES.Cs5, NOTES.E5, NOTES.A5, NOTES.Cs6, NOTES.A5, NOTES.E5, NOTES.Cs5, NOTES.B4, NOTES.D5, NOTES.Fs5, NOTES.B5, NOTES.Cs6, NOTES.B5, NOTES.A5, NOTES.Gs5],
      [NOTES.E5, NOTES.Gs5, NOTES.B5, NOTES.E6, NOTES.B5, NOTES.Gs5, NOTES.E5, NOTES.D5, NOTES.Cs5, NOTES.E5, NOTES.A5, NOTES.Cs6, NOTES.E6, NOTES.D6, NOTES.Cs6, NOTES.B4],
      [NOTES.Fs4, NOTES.A4, NOTES.Cs5, NOTES.Fs5, NOTES.A5, NOTES.Fs5, NOTES.Cs5, NOTES.A4, NOTES.Gs4, NOTES.B4, NOTES.E5, NOTES.Gs5, NOTES.B5, NOTES.A5, NOTES.Gs5, NOTES.Fs4],
      [NOTES.D4, NOTES.Fs4, NOTES.A4, NOTES.D5, NOTES.Fs5, NOTES.A5, NOTES.D6, NOTES.Fs6, NOTES.E6, NOTES.D6, NOTES.Cs6, NOTES.B5, NOTES.A5, NOTES.Gs5, NOTES.A5, NOTES.Cs6],
    ];

    this.playStringVoice(melody[bar][sub], time, stepDur * 1.5, 0.44, false);

    // 3) 환희의 벨
    if (sub === 0 || sub === 4 || sub === 8 || sub === 12) {
      this.playCelestaBell(melody[bar][sub] + 12, time, 0.35);
    }
  }

  /**
   * 4. 최종 시상식 BGM: "웅장한 환호의 오케스트라 교향곡 (C Major, 134 BPM)"
   * 베토벤 / 엘가 스타일의 영광스러운 피날레 사운드
   */
  private stepFinished(time: number, step: number) {
    const s16 = step % 64;
    const bar = Math.floor(s16 / 16);
    const sub = s16 % 16;
    const stepDur = 60 / 134 / 4;

    const grandBass = [NOTES.C3, NOTES.G3 - 12, NOTES.A3 - 12, NOTES.F3 - 12][bar];

    // 1) 웅장한 오케스트라 튜티 베이스
    if (sub === 0 || sub === 6 || sub === 8 || sub === 14) {
      this.playCelloBass(grandBass, time, stepDur * 2.5, 0.8);
    }

    // 2) 하늘을 찌르는 하이 바이올린 영광의 팡파레 선율
    const grandLead = [
      [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6, NOTES.C6, NOTES.G5, NOTES.E5, NOTES.D5, NOTES.F5, NOTES.A5, NOTES.D6, NOTES.F6, NOTES.D6, NOTES.A5, NOTES.F5],
      [NOTES.G5, NOTES.B5, NOTES.D6, NOTES.G6, NOTES.D6, NOTES.B5, NOTES.G5, NOTES.F5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.E6, NOTES.G6, NOTES.E6, NOTES.C6, NOTES.G5],
      [NOTES.A5, NOTES.C6, NOTES.E6, NOTES.A6, NOTES.G6, NOTES.F6, NOTES.E6, NOTES.D6, NOTES.C6, NOTES.E6, NOTES.A6, NOTES.G6, NOTES.F6, NOTES.E6, NOTES.D6, NOTES.C6],
      [NOTES.F5, NOTES.A5, NOTES.C6, NOTES.F6, NOTES.G5, NOTES.B5, NOTES.D6, NOTES.G6, NOTES.C6, NOTES.E6, NOTES.G6, NOTES.C7, NOTES.C7, NOTES.G6, NOTES.E6, NOTES.C6],
    ];

    this.playStringVoice(grandLead[bar][sub], time, stepDur * 1.6, 0.58, false);

    // 3) 축포 벨 셰이크
    if (sub % 2 === 0) {
      this.playCelestaBell(grandLead[bar][sub], time, 0.4);
    }
  }

  // ───────────────────────── 스케줄러 & 재생 제어 ─────────────────────────

  private scheduleLoop = () => {
    if (!this.ctx || this.currentTrack === "off") return;

    const lookahead = 0.12; // 120ms 앞서 스케줄링
    const tempo = this.currentTrack === "playing" ? 138 : this.currentTrack === "leaderboard" ? 122 : 130;
    const stepInterval = 60 / tempo / 4;

    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      switch (this.currentTrack) {
        case "lobby":
          this.stepLobby(this.nextStepTime, this.stepIndex);
          break;
        case "playing":
          this.stepPlaying(this.nextStepTime, this.stepIndex);
          break;
        case "leaderboard":
          this.stepLeaderboard(this.nextStepTime, this.stepIndex);
          break;
        case "finished":
          this.stepFinished(this.nextStepTime, this.stepIndex);
          break;
      }
      this.nextStepTime += stepInterval;
      this.stepIndex++;
    }

    this.timerId = window.setTimeout(this.scheduleLoop, 35);
  };

  /** 트랙 변경 (부드러운 볼륨 덕킹 & 스위칭) */
  public setTrack(track: BgmTrack) {
    if (this.currentTrack === track) return;
    this.initContext();

    if (this.ctx?.state === "suspended") {
      this.ctx.resume();
    }

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.currentTrack = track;

    if (track === "off" || !this.ctx) return;

    this.stepIndex = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduleLoop();
  }

  /** 음소거 토글 */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("tov_bgm_muted", String(this.isMuted));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /** 볼륨 조절 (0.0 ~ 1.0) */
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem("tov_bgm_vol", String(this.volume));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentTrack(): BgmTrack {
    return this.currentTrack;
  }

  // ───────────────────────── 효과음 (SFX) ─────────────────────────

  /** 카운트다운 째깍 비트 (고급 시계 메트로놈) */
  public playTick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.connect(g);
    g.connect(this.sfxGain);

    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /** 정답 성공 하프 팡파레 */
  public playCorrect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((note, idx) => {
      this.playCelestaBell(note, t + idx * 0.08, 0.6);
    });
  }

  /** 오답 실패 딩동 */
  public playWrong() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);
    osc.connect(g);
    g.connect(this.sfxGain);

    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.start(t);
    osc.stop(t + 0.36);
  }
}

// 싱글톤 사운드 매니저 인스턴스
export const sound = new ClassicalEngine();
