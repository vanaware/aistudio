import { render } from "preact";
import { initEnvironmentListeners } from "./store.ts";
import { App } from "./components/App.tsx";

// Initialize side effects (PWA, network)
initEnvironmentListeners();

// Mount Preact Application
const rootElement = document.getElementById("app");
if (rootElement) {
  render(<App />, rootElement);
}
