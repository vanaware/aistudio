import { h, render } from "https://esm.sh/preact@10.25.4";
import { App } from "./App.tsx";

const root = document.getElementById("root");
if (root) {
  render(<App />, root);
}
