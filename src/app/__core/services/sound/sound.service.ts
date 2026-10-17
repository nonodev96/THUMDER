import { DOCUMENT } from "@angular/common";
import { Injectable, inject } from "@angular/core";
import type { TypePipeline } from "@app/Types";
import { ConfigService } from "@core/config/config.service";
import {
  cycleSounds,
  gainOf,
  type Occupancy,
  type SoundEvent,
  type SoundStage,
  STAGE_NOTES,
  type StageSound,
  strumGap,
} from "./sound-design";

/** Running fast, at most a cycle every this many ms sounds: faster, the ear only hears noise (the pipeline is still followed) */
const MIN_CYCLE_GAP = 70;

type Voice = {
  type?: OscillatorType;
  gain: number;
  attack?: number;
  decay: number;
  /** The frequency it slides to while it sounds */
  glideTo?: number;
  /** Brightness: where the low-pass filter starts (it closes while the note fades) */
  bright?: number;
};

/**
 * The sounds of the simulation (sound-design.ts says what sounds and when), synthesized with the Web Audio API: no
 * files. The notes go through a small reverb, a compressor and a limiter: many of them together still sound soft. The
 * browsers only start the audio after a gesture of the user: the first click or key unlocks it. Without the Web Audio
 * API (the unit tests) nothing sounds, but what would have sounded is still written in `history`
 */
@Injectable({ providedIn: "root" })
export class SoundService {
  private readonly config = inject(ConfigService);
  private readonly document = inject(DOCUMENT);

  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private input: GainNode | null = null;
  private occupancy: Occupancy = new Map();
  private lastCycleAt = Number.NEGATIVE_INFINITY;

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

  /** A new program, or none: no instruction is in the pipeline */
  public resetPipeline(): void {
    this.occupancy = new Map();
  }

  /**
   * A cycle: a note for each stage an instruction entered, a knock for the stalled ones and a fall for the aborted ones.
   * `silent` only follows the pipeline (running without drawing, stepping back)
   */
  public cycle(pipeline: TypePipeline, cycleMs: number, silent = false): void {
    const { sounds, occupancy } = cycleSounds(pipeline, this.occupancy);
    this.occupancy = occupancy;
    if (silent || !this.settings.enabled || !this.settings.stages || sounds.length === 0) return;
    // A cycle by hand always sounds; running fast, one in a few
    const now = performance.now();
    if (cycleMs < MIN_CYCLE_GAP && now - this.lastCycleAt < MIN_CYCLE_GAP) return;
    this.lastCycleAt = now;
    this.record(sounds.map((sound) => `${sound.stage}:${sound.kind}`).join(" "));
    const context = this.ready();
    if (!context) return;
    const gap = strumGap(cycleMs);
    const start = context.currentTime + 0.01;
    // A full pipeline about as loud as one note
    const level = 1 / Math.sqrt(sounds.length);
    for (const [index, sound] of sounds.entries()) this.playStage(sound, start + index * gap, level);
  }

  /** An event of the simulation: its own sound, also when the notes of the stages are off */
  public event(event: SoundEvent): void {
    if (!this.settings.enabled) return;
    this.record(event);
    const context = this.ready();
    if (context) this.playEvent(event, context.currentTime + 0.01);
  }

  /** The button of the configuration: a pipeline that fills, a stall, a taken branch and the end of a program */
  public preview(): void {
    this.unlock();
    const context = this.ready(true);
    this.record("preview");
    if (!context) return;
    const cycles: StageSound[][] = [
      [{ stage: "IF", kind: "enter" }],
      [
        { stage: "IF", kind: "enter" },
        { stage: "ID", kind: "enter" },
      ],
      [
        { stage: "IF", kind: "enter" },
        { stage: "ID", kind: "enter" },
        { stage: "EX", kind: "enter" },
      ],
      [
        { stage: "IF", kind: "enter" },
        { stage: "ID", kind: "enter" },
        { stage: "EX", kind: "enter" },
        { stage: "MEM", kind: "enter" },
      ],
      [
        { stage: "IF", kind: "enter" },
        { stage: "ID", kind: "enter" },
        { stage: "EX", kind: "enter" },
        { stage: "MEM", kind: "enter" },
        { stage: "WB", kind: "enter" },
      ],
      [
        { stage: "ID", kind: "stall" },
        { stage: "MEM", kind: "enter" },
      ],
      [
        { stage: "ID", kind: "abort" },
        { stage: "EX", kind: "enter" },
      ],
    ];
    const start = context.currentTime + 0.05;
    for (const [cycle, sounds] of cycles.entries()) {
      for (const [index, sound] of sounds.entries())
        this.playStage(sound, start + cycle * 0.3 + index * 0.025, 1 / Math.sqrt(sounds.length));
    }
    this.playEvent("complete", start + cycles.length * 0.3 + 0.1);
  }

  private record(entry: string): void {
    this.history.push(entry);
    if (this.history.length > 40) this.history.splice(0, this.history.length - 40);
  }

  // ─── The synthesizer ────────────────────────────────────────────────────────────────────────────────────────────

  /** The audio context and its chain (voices → dry and reverb → compressor → volume), made once */
  private ensure(): AudioContext | null {
    if (this.context) return this.context;
    const AudioContextClass =
      (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      const context = new AudioContextClass();
      // Voices → dry and reverb → a soft compressor that joins them → makeup gain → volume → a limiter (never clips)
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.ratio.value = 4;
      const makeup = context.createGain();
      makeup.gain.value = 3.5;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.002;
      limiter.release.value = 0.1;
      this.master = context.createGain();
      this.input = context.createGain();
      const reverb = context.createConvolver();
      reverb.buffer = SoundService.impulse(context, 1.6);
      const wet = context.createGain();
      wet.gain.value = 0.25;
      this.input.connect(compressor);
      this.input.connect(reverb).connect(wet).connect(compressor);
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

  /** A room: noise that fades, a little different in each ear */
  private static impulse(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    return buffer;
  }

  private voice(frequency: number, when: number, voice: Voice): void {
    const context = this.context;
    if (!context || !this.input) return;
    const { type = "triangle", gain, attack = 0.004, decay, glideTo, bright = 6 } = voice;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, when);
    if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, when + decay);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(16000, frequency * bright), when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(150, frequency * 1.2), when + decay);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.exponentialRampToValueAtTime(gain, when + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    oscillator.connect(filter).connect(envelope).connect(this.input);
    oscillator.start(when);
    oscillator.stop(when + decay + 0.05);
  }

  /** A puff of noise through a band that moves (the air of the knocks and of the falls) */
  private noise(when: number, gain: number, decay: number, from: number, to: number): void {
    const context = this.context;
    if (!context || !this.input) return;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * decay), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.2;
    band.frequency.setValueAtTime(from, when);
    band.frequency.exponentialRampToValueAtTime(to, when + decay);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(gain, when);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    source.connect(band).connect(envelope).connect(this.input);
    source.start(when);
  }

  /** A bell: a note and an inharmonic partial that fades sooner */
  private bell(frequency: number, when: number, gain: number, decay = 0.8): void {
    this.voice(frequency, when, { type: "sine", gain, decay, bright: 4 });
    this.voice(frequency * 2.76, when, { type: "sine", gain: gain * 0.3, decay: decay * 0.4, bright: 3 });
  }

  /** A pluck: a soft triangle with an octave that shines at the start */
  private pluck(frequency: number, when: number, gain: number, decay = 0.35): void {
    this.voice(frequency, when, { gain, decay });
    this.voice(frequency * 2, when, { type: "sine", gain: gain * 0.25, decay: decay * 0.5 });
  }

  private playStage(sound: StageSound, when: number, level: number): void {
    const note = STAGE_NOTES[sound.stage as SoundStage];
    switch (sound.kind) {
      case "enter":
        // WB: the instruction ends, a little bell; the rest, a pluck
        if (sound.stage === "WB") this.bell(note, when, 0.22 * level, 0.6);
        else this.pluck(note, when, 0.3 * level);
        break;
      case "stall":
        // A dull knock: low, short and falling, with a touch of air
        this.voice(150, when, { type: "sine", gain: 0.4 * level, decay: 0.16, glideTo: 70, bright: 3 });
        this.noise(when, 0.08 * level, 0.05, 500, 200);
        break;
      case "abort":
        // The discarded instruction falls
        this.voice(note * 1.5, when, { gain: 0.2 * level, decay: 0.3, glideTo: note / 2.5, bright: 4 });
        this.noise(when, 0.07 * level, 0.25, 2500, 350);
        break;
    }
  }

  private playEvent(event: SoundEvent, when: number): void {
    switch (event) {
      case "load":
        // Ready: C, E and G going up
        for (const [index, note] of [523.25, 659.25, 783.99].entries()) this.pluck(note, when + index * 0.07, 0.22, 0.3);
        break;
      case "errors":
      case "error": {
        // Something is wrong: two low notes that clash, once (assembly) or going down (at run time)
        const hits =
          event === "errors"
            ? [[220, 233.08]]
            : [
                [220, 233.08],
                [174.61, 185],
              ];
        hits.forEach((pair, index) => {
          for (const note of pair) this.voice(note, when + index * 0.18, { type: "sawtooth", gain: 0.12, decay: 0.32, bright: 4 });
        });
        break;
      }
      case "complete":
        // The end: an arpeggio and its chord
        for (const [index, note] of [523.25, 659.25, 783.99, 1046.5].entries()) this.pluck(note, when + index * 0.09, 0.22, 0.4);
        for (const note of [523.25, 659.25, 783.99, 1046.5]) {
          this.voice(note, when + 0.38, { type: "sine", gain: 0.07, attack: 0.03, decay: 1.6, bright: 3 });
        }
        this.bell(2093, when + 0.38, 0.05, 1.2);
        break;
      case "breakpoint":
        // Stop here: two bells
        this.bell(987.77, when, 0.2);
        this.bell(1318.51, when + 0.14, 0.2);
        break;
      case "input":
        // A question: two soft notes going up
        this.voice(659.25, when, { type: "sine", gain: 0.18, decay: 0.3 });
        this.voice(880, when + 0.13, { type: "sine", gain: 0.18, decay: 0.45 });
        break;
      case "clear":
        // Everything to zero: a sweep down
        this.voice(880, when, { type: "sine", gain: 0.18, decay: 0.38, glideTo: 110 });
        this.noise(when, 0.06, 0.35, 3000, 300);
        break;
      case "back":
        // A cycle back: a short blip going down
        this.voice(660, when, { gain: 0.16, decay: 0.12, glideTo: 440 });
        break;
    }
  }
}
