import { Header } from "./Header.tsx";
import { TaskCard } from "./TaskCard.tsx";
import { Footnote } from "./Footnote.tsx";

export function App() {
  return (
    <div>
      <Header />

      <main class="responsive">
        <TaskCard />

        <div class="space"></div>

        <Footnote />
      </main>
    </div>
  );
}
