// Pure Deno build script - bundling Preact JSX and preparing static dist folder
import { copy } from "jsr:@std/fs/copy";

console.log("🚀 Starting Deno build...");

// 1. Ensure dist directory exists
await Deno.mkdir("dist", { recursive: true });

// 2. Bundle TypeScript & Preact JSX using Deno's bundle API
console.log("📦 Bundling src/main.tsx with Deno bundle...");
const bundleCommand = new Deno.Command("deno", {
  args: [
    "bundle",
    "-c",
    "deno.json",
    "--platform",
    "browser",
    "--minify",
    "src/main.tsx",
    "-o",
    "dist/app.js",
  ],
  stdout: "inherit",
  stderr: "inherit",
});

const bundleOutput = await bundleCommand.output();
if (!bundleOutput.success) {
  console.error("❌ Deno bundling failed!");
  Deno.exit(bundleOutput.code);
}

// 3. Copy index.html to dist/
console.log("📄 Copying index.html to dist/...");
await Deno.copyFile("index.html", "dist/index.html");

// 4. Copy static assets from public/ to dist/
console.log("🎨 Copying BeerCSS and PWA assets to dist/...");
try {
  await copy("public", "dist", { overwrite: true });
} catch (e) {
  console.warn("Public directory copy notice:", e);
}

console.log("✅ Deno build completed successfully! Output ready in dist/");
