// Runs several scripts of package.json at the same time, like `npm-run-all -p` (pnpm start: the development server and
// Electron). If one fails, the others are stopped; Ctrl+C stops them all. No dependencies.
//
//   node scripts/parallel.mjs electron:serve ng:serve:dev
import { spawn } from "node:child_process";

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("parallel: which scripts? node scripts/parallel.mjs <script> <script>...");
  process.exit(1);
}

const children = names.map((name) => {
  // On Windows pnpm is a .cmd file: it needs the shell
  const child = spawn("pnpm", ["run", name], { stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code, signal) => {
    const failed = code !== 0 && signal === null;
    if (failed) {
      console.error(`parallel: «${name}» ended with code ${code}: stopping the others`);
      process.exitCode = code ?? 1;
      for (const other of children) if (other !== child && other.exitCode === null) other.kill();
    }
  });
  return child;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const child of children) if (child.exitCode === null) child.kill(signal);
  });
}
