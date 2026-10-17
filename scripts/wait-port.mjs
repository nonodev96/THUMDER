// Waits until something listens on a TCP port of this computer, like `wait-on tcp:<port>` (pnpm start: Electron waits
// for the development server). No dependencies.
//
//   node scripts/wait-port.mjs 4200          up to 5 minutes (WAIT_PORT_TIMEOUT, in ms, changes it)
import net from "node:net";

const port = Number(process.argv[2] ?? 4200);
const timeout = Number(process.env.WAIT_PORT_TIMEOUT ?? 300_000);
// The development server may listen on IPv4 or on IPv6, depending on how the system resolves "localhost"
const hosts = ["127.0.0.1", "::1"];
const start = Date.now();

function listening(host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

while (true) {
  const answers = await Promise.all(hosts.map(listening));
  if (answers.some(Boolean)) process.exit(0);
  if (Date.now() - start > timeout) {
    console.error(`wait-port: nothing listens on port ${port} after ${Math.round(timeout / 1000)} s`);
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
