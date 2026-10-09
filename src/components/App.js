import { html } from "htm/preact";
import { Navbar } from "./Navbar.js";
import { Sidebar } from "./Sidebar.js";
import { Content } from "./Content.js";

export function App() {
  return html`
    <${Navbar} />
    <${Sidebar} />
    <${Content} />
  `;
}
