import { DOCUMENT } from "@angular/common";
import { Injectable, inject } from "@angular/core";
import type { TypePipeline } from "@app/Types";
import { ConfigService } from "@core/config/config.service";
import {
  cycleNotes,
  cycleSounds,
  EVENT_NOTES,
  FIRST_MELODY,
  frequency,
  gainOf,
  MAX_VOICES,
  type Melody,
  MIN_CYCLE_MS,
  type Note,
  type Occupancy,
  PREVIEW,
  PREVIEW_CYCLE_MS,
  type SoundEvent,
  type Timbre,
} from "./sound-design";

/** Seconds a note that is cut takes to fade out (never at once: it would click) */
const RELEASE = 0.04;

/** A note sounding or about to: its release gain fades it out when it is cut */
type Voice = { start: number; end: number; release: GainNode; sources: OscillatorNode[]; released: boolean };

/** A part of a note: an oscillator, how loud and how long it is next to the note, and its low-pass filter */
type Part = { type: OscillatorType; ratio: number; gain: number; length?: number; bright?: number; dark?: number };

/** How each timbre is made: its parts and its attack */
const RECIPES: Record<Timbre, { attack: number; partials: Part[] }> = {
  // A soft low triangle, with its octave so that small speakers play it too
  bass: {
    attack: 0.008,
    partials: [
      { type: "triangle", ratio: 1, gain: 1, bright: 5, dark: 1.5 },
      { type: "sine", ratio: 2, gain: 0.25, length: 0.6 },
    ],
  },
  // A plucked string: a triangle that darkens as it fades, with a touch of its octave at the start
  pluck: {
    attack: 0.005,
    partials: [
      { type: "triangle", ratio: 1, gain: 1, bright: 5, dark: 1.2 },
      { type: "sine", ratio: 2, gain: 0.12, length: 0.4 },
    ],
  },
  // A music box: a sine with its octave and the octave above it, which fade sooner
  bell: {
    attack: 0.004,
    partials: [
      { type: "sine", ratio: 1, gain: 1 },
      { type: "sine", ratio: 2, gain: 0.2, length: 0.35 },
      { type: "sine", ratio: 4, gain: 0.05, length: 0.15 },
    ],
  },
  // A muted note: a dark triangle, short, with a knock of its octave and its twelfth that small speakers play
  muted: {
    attack: 0.006,
    partials: [
      { type: "triangle", ratio: 1, gain: 1, bright: 1.8, dark: 1.1 },
      { type: "sine", ratio: 2, gain: 0.4, length: 0.4 },
      { type: "sine", ratio: 3, gain: 0.15, length: 0.25 },
    ],
  },
  // A sine that starts gently
  soft: {
    attack: 0.02,
    partials: [
      { type: "sine", ratio: 1, gain: 1 },
      { type: "sine", ratio: 2, gain: 0.08, length: 0.5 },
    ],
  },
  // The notes that clash in the errors: a triangle a little brighter
  clash: { attack: 0.01, partials: [{ type: "triangle", ratio: 1, gain: 1, bright: 4, dark: 1.5 }] },
};

/**
 * The sounds of the simulation (sound-design.ts says what sounds and when), synthesized with the Web Audio API: no
 * files. Never more than MAX_VOICES notes sound at a time: a new note cuts the oldest one, and each cycle cuts what the
 * cycle before still plays (a fade of 40 ms), so nothing piles up running fast. The notes go through a small dark
 * reverb, a soft compressor and a limiter. The browsers only start the audio after a gesture of the user: the first
 * click or key unlocks it. Without the Web Audio API (the unit tests) nothing sounds, but what would have sounded is
 * still written in `history`
 */
@Injectable({ providedIn: "root" })
export class SoundService {
  private readonly config = inject(ConfigService);
  private readonly document = inject(DOCUMENT);

  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private input: GainNode | null = null;
  private occupancy: Occupancy = new Map();
  private melody: Melody = FIRST_MELODY;
  private lastCycleAt = Number.NEGATIVE_INFINITY;
  /** The notes sounding or about to, the oldest first */
  private voices: Voice[] = [];
  /** When the notes of the last cycle have started: an event of that cycle sounds after them */
  private cycleTail = 0;

  /** What sounded last (the newest at the end), to check it (e2e) and to see it in the debug window */
  public readonly history: string[] = [];

  constructor() {
    // The first gesture of the user anywhere unlocks the audio
    const unlock = () => {
      this.unlock();
      if (this.context?.state === "running") {
        this.document.removeEventListener("pointerdown", unlock, true);
        this.document.removeEventListener("keydown", unlock, true);
      }
    };
    this.document.addEventListener("pointerdown", unlock, true);
    this.document.addEventListener("keydown", unlock, true);
  }

  private get settings() {
    return this.config.value().sound;
  }

  /** From a gesture of the user (a button, a key): the browser lets the audio start */
  public unlock(): void {
    if (!this.settings.enabled) return;
    const context = this.ensure();
    if (context?.state === "suspended") void context.resume().catch(() => undefined);
  }

  /** A new program, or none: no instruction is in the pipeline and the piece starts again */
  public resetPipeline(): void {
    this.occupancy = new Map();
    this.melody = FIRST_MELODY;
  }

  /**
   * A cycle: its arpeggio (the pulse, the middle and the melody, or what went wrong), which cuts what the cycle before
   * still plays. `silent` only follows the pipeline (running without drawing, stepping back)
   */
  public cycle(pipeline: TypePipeline, cycleMs: number, silent = false): void {
    const { sounds, occupancy, position } = cycleSounds(pipeline, this.occupancy);
    this.occupancy = occupancy;
    if (silent || !this.settings.enabled || !this.settings.stages || sounds.length === 0) return;
    // A cycle by hand always sounds; running fast, one in a few
    const now = performance.now();
    if (cycleMs < MIN_CYCLE_MS && now - this.lastCycleAt < MIN_CYCLE_MS) return;
    this.lastCycleAt = now;
    this.record(sounds.map((sound) => `${sound.stage}:${sound.kind}`).join(" "));
    const { notes, melody } = cycleNotes({ sounds, position }, cycleMs, this.melody);
    this.melody = melody;
    const context = this.ready();
    if (context) this.playCycle(notes, context.currentTime + 0.01);
  }

  /** An event of the simulation: its own sound (after the notes of its cycle), also when the notes of the stages are off */
  public event(event: SoundEvent): void {
    if (!this.settings.enabled) return;
    this.record(event);
    const context = this.ready();
    if (context) this.play(EVENT_NOTES[event], Math.max(context.currentTime + 0.01, this.cycleTail));
  }

  /** The button of the configuration: a pipeline that fills, a stall, a taken branch and the end of a program */
  public preview(): void {
    this.unlock();
    const context = this.ready(true);
    this.record("preview");
    if (!context) return;
    const start = context.currentTime + 0.05;
    let melody = FIRST_MELODY;
    for (const [index, cycle] of PREVIEW.entries()) {
      const played = cycleNotes(cycle, PREVIEW_CYCLE_MS, melody);
      melody = played.melody;
      this.playCycle(played.notes, start + (index * PREVIEW_CYCLE_MS) / 1000);
    }
    this.play(EVENT_NOTES.complete, start + (PREVIEW.length * PREVIEW_CYCLE_MS) / 1000 + 0.05);
  }

  private record(entry: string): void {
    this.history.push(entry);
    if (this.history.length > 40) this.history.splice(0, this.history.length - 40);
  }

  // ─── The synthesizer ────────────────────────────────────────────────────────────────────────────────────────────

  /** The audio context and its chain (voices → dry and reverb → compressor → volume → limiter), made once */
  private ensure(): AudioContext | null {
    if (this.context) return this.context;
    const AudioContextClass =
      (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      const context = new AudioContextClass();
      // A soft compressor that joins the notes and the reverb, its makeup gain, the volume and a limiter (never clips)
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 12;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.15;
      const makeup = context.createGain();
      makeup.gain.value = 1.8;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.1;
      this.master = context.createGain();
      this.input = context.createGain();
      // The reverb: darker than the notes, so that it does not hiss
      const dark = context.createBiquadFilter();
      dark.type = "lowpass";
      dark.frequency.value = 3000;
      const reverb = context.createConvolver();
      reverb.buffer = SoundService.impulse(context, 1.4);
      const wet = context.createGain();
      wet.gain.value = 0.2;
      this.input.connect(compressor);
      this.input.connect(dark).connect(reverb).connect(wet).connect(compressor);
      compressor.connect(makeup).connect(this.master).connect(limiter).connect(context.destination);
      this.context = context;
    } catch {
      this.context = null;
    }
    return this.context;
  }

  /** The context ready to play, with the volume of the configuration (null: no audio, or not unlocked yet) */
  private ready(force = false): AudioContext | null {
    const context = force ? this.ensure() : this.context;
    if (!context || !this.master || (context.state !== "running" && !force)) return null;
    this.master.gain.setTargetAtTime(gainOf(this.settings.volume), context.currentTime, 0.01);
    return context;
  }

  /** A room: noise that fades, a little different in each ear, after a short silence */
  private static impulse(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds);
    const delay = Math.floor(context.sampleRate * 0.015);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = delay; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - (i - delay) / (length - delay)) ** 3;
    }
    return buffer;
  }

  /** The notes of a cycle from `start`: what the cycle before still plays fades out */
  private playCycle(notes: Note[], start: number): void {
    for (const voice of this.voices) this.release(voice, start);
    this.play(notes, start);
    if (notes.length > 0) this.cycleTail = start + (notes.at(-1)?.at ?? 0) + 0.08;
  }

  /** Notes from `start`, each one after cutting the oldest that sounds if there are already MAX_VOICES */
  private play(notes: Note[], start: number): void {
    for (const note of notes) this.note(note, start + note.at);
  }

  /** Fades a voice out from `at` (one that has not started yet never sounds) */
  private release(voice: Voice, at: number): void {
    if (voice.released || voice.end <= at) return;
    voice.released = true;
    const gain = voice.release.gain;
    if (voice.start >= at) gain.setValueAtTime(0, at);
    else {
      gain.setValueAtTime(1, at);
      gain.linearRampToValueAtTime(0, at + RELEASE);
    }
    const stop = Math.max(at, voice.start) + RELEASE + 0.01;
    for (const source of voice.sources) {
      try {
        source.stop(stop);
      } catch {
        // Already stopped
      }
    }
    voice.end = Math.min(voice.end, at + RELEASE);
  }

  private note(note: Note, when: number): void {
    const context = this.context;
    if (!context || !this.input) return;
    // The voices that have ended go; if MAX_VOICES sound when this one starts, the oldest one fades out
    this.voices = this.voices.filter((voice) => voice.end > context.currentTime);
    const sounding = this.voices.filter((voice) => !voice.released && voice.start <= when && voice.end > when);
    for (const voice of sounding.slice(0, Math.max(0, sounding.length - MAX_VOICES + 1))) this.release(voice, when);

    const { attack, partials } = RECIPES[note.timbre];
    const release = context.createGain();
    let output: AudioNode = release;
    if (note.pan && typeof context.createStereoPanner === "function") {
      const panner = context.createStereoPanner();
      panner.pan.value = note.pan;
      release.connect(panner);
      output = panner;
    }
    output.connect(this.input);
    const base = frequency(note.midi);
    const sources: OscillatorNode[] = [];
    for (const partial of partials) {
      const pitch = base * partial.ratio;
      if (pitch > 16000) continue;
      const length = note.length * (partial.length ?? 1);
      const oscillator = context.createOscillator();
      oscillator.type = partial.type;
      oscillator.frequency.setValueAtTime(pitch, when);
      if (note.bend) oscillator.frequency.exponentialRampToValueAtTime(pitch * 2 ** (note.bend / 12), when + note.length);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, when);
      envelope.gain.linearRampToValueAtTime(note.gain * partial.gain, when + attack);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(length, attack + 0.02));
      let chain: AudioNode = oscillator;
      if (partial.bright) {
        // It darkens as it fades
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.Q.value = 0.5;
        filter.frequency.setValueAtTime(Math.min(16000, pitch * partial.bright), when);
        filter.frequency.exponentialRampToValueAtTime(Math.max(120, pitch * (partial.dark ?? 1)), when + length);
        chain = chain.connect(filter);
      }
      chain.connect(envelope).connect(release);
      oscillator.start(when);
      oscillator.stop(when + length + 0.03);
      sources.push(oscillator);
    }
    this.voices.push({ start: when, end: when + note.length + 0.03, release, sources, released: false });
  }
}
