/**
 * Build-time static HTML pre-renderer.
 *
 * Reads the SSG_ROUTES manifest and writes an HTML shell for each static
 * route into dist/.  Each shell is a copy of dist/index.html with the
 * canonical path embedded so relative asset URLs still resolve correctly.
 *
 * Usage (run after `vite build`):
 *   node scripts/prerender.mjs
 *
 * CI usage:
 *   npm run build:ssg     # runs vite build then this script
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const routesFilePath = resolve(ROOT, "src", "ssg-routes.ts");
const routesSource   = readFileSync(routesFilePath, "utf-8");
const routeMatches   = [...routesSource.matchAll(/"(\/[^"]*)"/g)];
const SSG_ROUTES     = routeMatches.map(([, path]) => path);

if (SSG_ROUTES.length === 0) {
  console.error("prerender: no routes found in ssg-routes.ts — aborting.");
  process.exit(1);
}

let shell;
try {
  shell = readFileSync(resolve(DIST, "index.html"), "utf-8");
} catch {
  console.error("prerender: dist/index.html not found — run `npm run build` first.");
  process.exit(1);
}

let written = 0;
for (const route of SSG_ROUTES) {
  if (route === "/") continue;

  const outDir  = resolve(DIST, route.replace(/^\//, ""));
  const outFile = resolve(outDir, "index.html");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, shell);
  written++;
}

console.log(`prerender: wrote ${written} static route shells (+ root index.html).`);
console.log(`prerender: routes → ${SSG_ROUTES.join(", ")}`);
