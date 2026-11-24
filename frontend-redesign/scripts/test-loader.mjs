/**
 * Minimal TypeScript test loader built on Node's type stripping (Node >=22.13).
 * Runtime test fixtures have no npm compiler API dependency: TypeScript 7 is a
 * native compiler and intentionally doesn't provide the TS 6 JS API.
 */
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";

export function evaluateTypescript(fileURL, { context, imports = {}, exports: exportNames }) {
  const source = readFileSync(fileURL, "utf8");
  let js = stripTypeScriptTypes(source, { mode: "strip", sourceUrl: String(fileURL) });
  // These fixtures use named imports; expose their mocked dependencies explicitly.
  js = js.replace(/^\s*import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["'];?\s*$/gm,
    (_match, names, specifier) => `const { ${names} } = __imports[${JSON.stringify(specifier)}];`);
  if (/^\s*import\s/m.test(js)) throw new Error(`Unmocked import in ${fileURL}`);
  js = js.replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, "");
  if (/\bexport\s+(?!\{)/.test(js)) throw new Error(`Unexpected TS export in ${fileURL}`);
  js += `\nObject.assign(exports, { ${exportNames.join(", ")} });\n`;
  vm.runInNewContext(js, { ...context, __imports: imports }, { filename: String(fileURL) });
  return context.exports;
}
