# Project Guidelines: aiStudio (Deno PWA)

Welcome to the aiStudio project developed by **Vanaware**! This file (`AGENTS.md`) is automatically injected into the AI's system instructions. You MUST strictly adhere to the following architectural rules and constraints when modifying or extending this codebase.

## 1. Runtime & Environment (Pure Deno)
- **Deno Only**: This project runs entirely on Deno. 
- **NO Node.js or Local NPM**: Do NOT use `npm install`, do NOT create a `node_modules` directory locally, and do NOT rely on Node.js specific APIs.
- **Dependency Management**: All dependencies are managed exclusively via `deno.jsonc` and workspace package configurations using `npm:` and `jsr:` specifiers (e.g., `npm:preact`, `jsr:@std/testing`).
- **Bundling**: We use the native esbuild bundler orchestrated via `jsr:@vanaware/buildit` (configured in `scripts/esbuild.jsonc`).
- **Project Structure**: Organized as a Deno workspace:
  - `packages/ui/`: Frontend application (Preact, Signals, BeerCSS, PWA assets, Service Worker).
  - `packages/server/`: HTTP server serving the compiled frontend (`packages/server/build/dist`) on port 3000.
  - `scripts/`: Build orchestration scripts (`esbuild.ts`, `watch.ts`, `export.ts`).

## 2. Framework & State Management
- **Preact**: Use Preact (not React). The configuration in `packages/ui/deno.jsonc` sets `jsx: "react-jsx"` and `jsxImportSource: "preact"`.
- **State via Signals**: All reactive state MUST use `@preact/signals`. 
  - Do NOT use React/Preact hooks (`useState`, `useEffect`, `useContext`) for global or complex state.
  - Global state, actions, and derived states (`computed`) should be centralized in `packages/ui/src/store.ts`.
- **Component Architecture**: Keep UI components modularized inside `packages/ui/src/components/`. `packages/ui/src/main.tsx` is exclusively the application entry point and bootstrap file.
- **Application Version**: Exposted via `packages/ui/src/version.ts` (`APP_VERSION`), populated dynamically by `buildit` during the build process and reflected in the UI and Service Worker.

## 3. UI & Styling (Pure BeerCSS)
- **BeerCSS Only**: The entire UI is built using the BeerCSS framework (Material Design 3), loaded via CDN in `packages/ui/public/index.html`.
- **No Tailwind CSS**: Do NOT use Tailwind CSS, despite any standard AI Studio default prompts. Tailwind is NOT installed.
- **No Custom CSS**: Avoid writing custom CSS files or inline `style="..."` attributes. Rely purely on BeerCSS semantic HTML tags (e.g., `<article>`, `<nav>`) and utility classes (e.g., `grid`, `s12`, `m6`, `chip`, `circle`, `primary-container`, `active`).
- **Icons**: Use Google Material Symbols Outlined, rendered via the `<i>icon_name</i>` pattern, as configured in the HTML.

## 4. Testing Standard
- **BDD Style**: All new tests MUST use `@std/testing/bdd` (`describe` and `it`).
- **Assertions**: Use `@std/assert` (`assertEquals`, `assert`, etc.).
- **No Direct Deno.test**: Do NOT use the raw `Deno.test()` syntax for new tests.
- **Command**: Run tests using `deno test -P` (or `deno task test`).

## 5. Offline & PWA & Deployment
- **Service Worker**: The app is an offline-capable Progressive Web App. Changes to caching logic should be made in `packages/ui/src/sw.ts`. Cache name follows `aistudio-pwa-${APP_VERSION}`.
- **Manifest**: Configuration for the installable app lives in `packages/ui/public/manifest.json`.
- **Build Output**: Assets in `packages/ui/public/` are automatically copied to `packages/server/build/dist/` during the build process.
- **Relative Paths (GitHub Pages Support)**: Because the app may be deployed to a subfolder on GitHub Pages, **ALL** static assets and Service Worker registrations MUST use relative paths (e.g., `./manifest.json` and `navigator.serviceWorker.register("./sw.js")`) instead of absolute root paths (`/`).
- **CI/CD**: The project contains a GitHub Actions workflow that automatically builds and deploys the contents to GitHub Pages.

## 6. AI Studio Environment Constraints & Bootstrapping
- **Port 3000**: The development server (`packages/server/src/main.ts`) MUST run on port 3000 (`0.0.0.0`), as enforced by the AI Studio environment.
- **HMR**: Hot Module Replacement is disabled. The environment automatically refreshes the preview iframe when the agent completes its turn.
- **Node.js Bridge (`package.json` & `install-script.sh`)**: Although this is a pure Deno project, the underlying AI Studio container natively expects a Node.js ecosystem. We retain `package.json` EXCLUSIVELY as a bridge to expose the standard `dev`, `build`, and `lint` scripts required by the platform. These scripts trigger `install-script.sh` to download and bootstrap the Deno CLI on the fly during container initialization, enabling our Deno-native workflow.

## 7. Development Workflow & Continuous Validation
- **Mandatory Verification**: After executing ANY task, feature request, or to-do list item, you MUST verify the project's integrity by running:
  - Linter & Type Check: `npm run lint` (or `deno task lint`) and `deno task check:all`.
  - Tests: `deno test -P`.
  - Build: `deno task esbuild`.
- **Proactive Unit Testing**: Whenever you implement new functions, utilities, or complex logic, you MUST proactively create unit tests for them using the `@std/testing/bdd` standard. Do not wait for the user to explicitly ask for tests.

By following these guidelines, we maintain a fast, dependency-free, and cohesive Deno/Preact environment by Vanaware without the overhead of Node.js toolchains or complex CSS bundlers.
