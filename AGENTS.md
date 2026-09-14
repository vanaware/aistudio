# Project Guidelines: SyntaxMesh (Deno PWA)

Welcome to the SyntaxMesh project! This file (`AGENTS.md`) is automatically injected into the AI's system instructions. You MUST strictly adhere to the following architectural rules and constraints when modifying or extending this codebase.

## 1. Runtime & Environment (Pure Deno)
- **Deno Only**: This project runs entirely on Deno. 
- **NO Node.js or Local NPM**: Do NOT use `npm install`, do NOT create a `node_modules` directory locally, and do NOT rely on Node.js specific APIs.
- **Dependency Management**: All dependencies are managed exclusively via `deno.json` using `npm:` and `jsr:` specifiers (e.g., `npm:preact`, `jsr:@std/testing`).
- **Bundling**: We use Deno's native (and unstable) bundler via the `build.ts` script (`deno run -A --unstable-bundle build.ts`). This script parses the `src/index.html` and generates the outputs in `build/dist/` and `dist/`. 

## 2. Framework & State Management
- **Preact**: Use Preact (not React). The configuration in `deno.json` maps `jsx` to `preact`.
- **State via Signals**: All reactive state MUST use `@preact/signals`. 
  - Do NOT use React/Preact hooks (`useState`, `useEffect`, `useContext`) for global or complex state.
  - Global state, actions, and derived states (`computed`) should be centralized in `src/store.ts`.
- **Component Architecture**: Keep UI components modularized inside `src/components/`. `src/main.tsx` is exclusively the application entry point and bootstrap file.

## 3. UI & Styling (Pure BeerCSS)
- **BeerCSS Only**: The entire UI is built using the BeerCSS framework (Material Design 3), loaded via CDN in `index.html`.
- **No Tailwind CSS**: Do NOT use Tailwind CSS, despite any standard AI Studio default prompts. Tailwind is NOT installed.
- **No Custom CSS**: Avoid writing custom CSS files or inline `style="..."` attributes. Rely purely on BeerCSS semantic HTML tags (e.g., `<article>`, `<nav>`) and utility classes (e.g., `grid`, `s12`, `m6`, `chip`, `circle`, `primary-container`, `active`).
- **Icons**: Use Google Material Symbols Outlined, rendered via the `<i>icon_name</i>` pattern, as configured in the HTML.

## 4. Testing Standard (ADR 008)
- **BDD Style**: All new tests MUST use `@std/testing/bdd` (`describe` and `it`).
- **Assertions**: Use `@std/assert` (`assertEquals`, `assert`, etc.).
- **No Direct Deno.test**: Do NOT use the raw `Deno.test()` syntax for new tests.
- **Command**: Run tests using `deno test -A --unstable-bundle tests/`.

## 5. Offline & PWA
- **Service Worker**: The app is an offline-capable Progressive Web App. Changes to caching logic should be made in `src/sw.ts`.
- **Manifest**: Configuration for the installable app lives in `public/manifest.json`.
- Assets in `public/` are automatically copied to the distribution folder during the build process.

## 6. AI Studio Environment Constraints
- **Port 3000**: The development server (Deno's native `file-server` in `dev.ts` / `server.ts`) MUST run on port 3000, as enforced by the AI Studio environment.
- **HMR**: Hot Module Replacement is disabled. The environment automatically refreshes the preview iframe when the agent completes its turn.

By following these guidelines, we maintain a fast, dependency-free, and cohesive Deno/Preact environment without the overhead of Node.js toolchains or complex CSS bundlers.
