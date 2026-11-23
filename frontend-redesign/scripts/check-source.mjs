/** The supported source gate works with TypeScript 7's compiler CLI. */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
}
walk("src");
let errors = 0;
for (const name of files) {
  const source = readFileSync(name, "utf8");
  const imports = [...source.matchAll(/(?:\bfrom\s*|\bimport\s*|\bimport\(\s*)["']([.@][^"']+)["']/g)];
  for (const match of imports) {
    const path = match[1];
    if (!path.startsWith("./") && !path.startsWith("../") && !path.startsWith("@/")) continue;
    const base = path.startsWith("@/") ? resolve("src", path.slice(2)) : resolve(dirname(name), path);
    const endings = ["", ".ts", ".tsx", ".css", ".json", ".svg", "/index.ts", "/index.tsx"];
    if (!endings.some((suffix) => existsSync(base + suffix))) {
      console.error(`Missing local import: ${name}: ${path}`);
      errors++;
    }
  }
}
if (errors) process.exit(1);
const compiler = resolve("node_modules/typescript/bin/tsc");
if (!existsSync(compiler)) {
  console.error("TypeScript is missing. Run npm ci before running source checks.");
  process.exit(1);
}
const result = spawnSync(process.execPath, [compiler, "--project", "tsconfig.json", "--pretty", "false"], { encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stdout || result.stderr || "TypeScript compile failed.\n");
  process.exit(result.status ?? 1);
}
console.log(`PASS: ${files.length} source modules, resolved local imports, full TypeScript compiler check.`);
