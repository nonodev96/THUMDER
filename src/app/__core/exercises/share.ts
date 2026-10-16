import type { TypeFloatingPointStageConfiguration } from "@app/Types";
import { validateConfig } from "@core/config/config";

// An exercise shared by a link (EDU-07): a program, the configuration of the machine and the options the teacher locks.
// It goes in the link itself, compressed (deflate) and in base64url: there is no server.

/** The options of the machine an exercise can lock */
export const LOCKABLE = ["forwarding", "floatingPoint", "memorySize"] as const;
export type Lockable = (typeof LOCKABLE)[number];

export type SharedExercise = {
  version: 1;
  name: string;
  content: string;
  /** What the person sees before opening it */
  statement: string;
  forwarding: boolean;
  floatingPoint: TypeFloatingPointStageConfiguration;
  memorySize: number;
  locked: Lockable[];
};

/** The longest program a link takes (the links of the browsers stop working long before 1 MB) */
export const MAX_CONTENT = 60_000;

const toBase64Url = (bytes: Uint8Array) => {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const body = new Response(bytes as BodyInit).body as ReadableStream<Uint8Array>;
  return new Uint8Array(await new Response(body.pipeThrough(stream)).arrayBuffer());
}

/** An exercise as the text of a link */
export async function encodeExercise(exercise: SharedExercise): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(exercise));
  return toBase64Url(await transform(json, new CompressionStream("deflate-raw")));
}

/** The exercise of a link, valid (or an error: a link cut or changed) */
export async function decodeExercise(text: string): Promise<SharedExercise> {
  const json = new TextDecoder().decode(await transform(fromBase64Url(text), new DecompressionStream("deflate-raw")));
  const raw = JSON.parse(json) as Partial<SharedExercise>;
  if (typeof raw.content !== "string" || raw.content.length > MAX_CONTENT) throw new Error("The exercise has no program");
  const machine = validateConfig({ forwarding: raw.forwarding, floatingPoint: raw.floatingPoint, memorySize: raw.memorySize });
  // A name of 100 characters at most, with its .s (firestore.rules)
  const stem = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().replace(/\.s$/i, "") : "ejercicio";
  return {
    version: 1,
    name: `${stem.slice(0, 98).trimEnd()}.s`,
    content: raw.content,
    statement: typeof raw.statement === "string" ? raw.statement.slice(0, 2000) : "",
    forwarding: machine.forwarding,
    floatingPoint: machine.floatingPoint,
    memorySize: machine.memorySize,
    locked: (Array.isArray(raw.locked) ? raw.locked : []).filter((key): key is Lockable => LOCKABLE.includes(key as Lockable)),
  };
}
