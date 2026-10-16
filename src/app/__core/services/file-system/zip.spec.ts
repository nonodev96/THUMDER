import { describe, expect, it } from "vitest";
import { crc32, createZip, readZip } from "./zip";

describe("zip", () => {
  it("computes the CRC-32 of ZIP", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes a ZIP that it reads back, with the folders and the accents", async () => {
    const entries = [
      { path: "bucle.s", content: "loop: j loop\n", date: Date.UTC(2026, 0, 1) },
      { path: "ejemplos/año/datos.s", content: ".data\n.word 1, 2, 3\n" },
    ];
    const zip = createZip(entries);
    expect(zip.type).toBe("application/zip");
    const read = await readZip(await zip.arrayBuffer());
    expect(read.map(({ path, content }) => ({ path, content }))).toEqual(entries.map(({ path, content }) => ({ path, content })));
  });

  it("reads the files compressed with deflate", async () => {
    const content = "addi r1,r0,1\n".repeat(50);
    const body = new Response(content).body as ReadableStream<Uint8Array>;
    const data = new Uint8Array(await new Response(body.pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
    // A ZIP made by hand with one entry compressed (method 8)
    const stored = new Uint8Array(await createZip([{ path: "x.s", content }]).arrayBuffer());
    const view = new DataView(stored.buffer);
    const name = new TextEncoder().encode("x.s");
    const local = new Uint8Array(30 + name.length + data.length);
    local.set(stored.subarray(0, 30));
    const localView = new DataView(local.buffer);
    localView.setUint16(8, 8, true);
    localView.setUint32(18, data.length, true);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    const centralStart = view.getUint32(stored.length - 22 + 16, true);
    const central = stored.slice(centralStart, stored.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint16(10, 8, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(central.length - 22 + 16, local.length, true);
    const zip = new Uint8Array(local.length + central.length);
    zip.set(local);
    zip.set(central, local.length);
    expect(await readZip(zip.buffer)).toEqual([{ path: "x.s", content }]);
  });

  it("rejects what is not a ZIP", async () => {
    await expect(readZip(new TextEncoder().encode("hello, this is not a zip file at all").buffer as ArrayBuffer)).rejects.toThrow(/Not a ZIP/);
  });
});
