// Production build: bundles + minifies JS and CSS into dist/. Run: npm run build
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
mkdirSync("dist", { recursive: true });
await build({ entryPoints: { app: "js/main.js" }, bundle: true, minify: true, outdir: "dist", format: "esm" });
await build({ entryPoints: { styles: "css/main.css" }, bundle: true, minify: true, outdir: "dist" });
const html = readFileSync("index.html", "utf8")
  .replace("css/main.css", "styles.css").replace("js/main.js", "app.js");
writeFileSync("dist/index.html", html);
console.log("Built to dist/");
