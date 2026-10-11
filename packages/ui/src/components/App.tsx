import { Header } from "./Header.tsx";
import { CounterCard } from "./CounterCard.tsx";
import { TaskMeshCard } from "./TaskMeshCard.tsx";
import { PwaStatusCard } from "./PwaStatusCard.tsx";

export function App() {
  return (
    <div>
      <Header />

      <main class="responsive padding">
        <div class="grid">
          <div class="s12 m6">
            <CounterCard />
          </div>

          <div class="s12 m6">
            <TaskMeshCard />
          </div>

          <div class="s12">
            <PwaStatusCard />
          </div>
        </div>
      </main>
    </div>
  );
}
