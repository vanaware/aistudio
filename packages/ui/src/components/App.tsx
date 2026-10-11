import { Header } from "./Header.tsx";
import { TaskCard } from "./TaskCard.tsx";
import { PwaStatusCard } from "./PwaStatusCard.tsx";
import { Footnote } from "./Footnote.tsx";

export function App() {
  return (
    <div>
      <Header />

      <main class="responsive">
        <div class="grid">
          <div class="s12">
            <TaskCard />
          </div>

          <div class="s12">
            <PwaStatusCard />
          </div>
        </div>

        <div class="space"></div>

        <Footnote />
      </main>
    </div>
  );
}
