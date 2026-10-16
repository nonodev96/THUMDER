/**
 * Creates the environment files that angular.json swaps in for each build configuration
 * (src/environments/environment.{dev,web,production}.ts) from the _environment.ts template.
 * They hold the Firebase keys, so they are git-ignored; existing files are never overwritten.
 * Run automatically as a postinstall script.
 */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "environments");
const template = fs.readFileSync(path.join(dir, "_environment.ts"), "utf8");

const ENVIRONMENTS = {
  dev: { environment: "DEV", production: false },
  web: { environment: "WEB", production: true },
  production: { environment: "PRODUCTION", production: true },
};

for (const [name, { environment, production }] of Object.entries(ENVIRONMENTS)) {
  const file = path.join(dir, `environment.${name}.ts`);
  if (fs.existsSync(file)) continue;
  const content = template
    .replace(/environment: ".*?"/, `environment: "${environment}"`)
    .replace(/production: (true|false)/, `production: ${production}`);
  fs.writeFileSync(file, content);
  console.log(`Created ${path.relative(process.cwd(), file)} (add your Firebase keys there)`);
}
