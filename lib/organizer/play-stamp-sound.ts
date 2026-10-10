import type { GameStampSound } from "@/lib/organizer/game-experience";

/** スタンプを押したときの音。音声ファイルがあればそれを、なければ短い効果音。 */
export function playStampSound(sound: GameStampSound, soundUrl?: string): void {
  if (typeof window === "undefined") return;
  if (soundUrl) {
    const audio = new Audio(soundUrl);
    audio.volume = 0.8;
    void audio.play().catch(() => undefined);
    return;
  }
  if (sound === "none") return;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + (sound === "chime" ? 0.55 : 0.22));
  master.connect(ctx.destination);

  const tone = (frequency: number, start: number, stop: number) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, start);
    osc.connect(master);
    osc.start(start);
    osc.stop(stop);
  };

  if (sound === "chime") {
    tone(523.25, now, now + 0.55);
    tone(659.25, now + 0.08, now + 0.55);
  } else {
    tone(620, now, now + 0.22);
  }

  window.setTimeout(() => void ctx.close(), 800);
}
