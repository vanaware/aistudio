import { signal, computed } from "@preact/signals";

// ==========================================
// PWA & Environment Signals
// ==========================================
export const isOnline = signal<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
export const swActive = signal<boolean>(false);
export const installPrompt = signal<any>(null);
export const currentThemeMode = signal<"auto" | "light" | "dark">("auto");

export function initEnvironmentListeners() {
  if (typeof window === "undefined") return;

  // Listen for network connectivity changes
  window.addEventListener("online", () => {
    isOnline.value = true;
  });
  window.addEventListener("offline", () => {
    isOnline.value = false;
  });

  // Listen for PWA installation prompt
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    installPrompt.value = e;
  });

  // Register PWA Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          swActive.value = !!reg.active || !!reg.installing;
          console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Falha ao registrar Service Worker:", err);
        });
    });
  }
}

// ==========================================
// Reactive App Signals: Counter & Math
// ==========================================
export const count = signal<number>(5);
export const step = signal<number>(1);
export const square = computed<number>(() => count.value * count.value);
export const cube = computed<number>(() => count.value * count.value * count.value);
export const isEven = computed<boolean>(() => count.value % 2 === 0);

// ==========================================
// Reactive App Signals: Task Mesh
// ==========================================
export interface Task {
  id: number;
  title: string;
  category: "Deno" | "PWA" | "Preact" | "BeerCSS";
  completed: boolean;
}

const initialTasks: Task[] = [
  { id: 1, title: "Configurar Deno.bundle nativo", category: "Deno", completed: true },
  { id: 2, title: "Registrar Service Worker offline", category: "PWA", completed: true },
  { id: 3, title: "Migrar estado reativo para Signals", category: "Preact", completed: true },
  { id: 4, title: "Aplicar Material Design 3 com BeerCSS", category: "BeerCSS", completed: true },
  { id: 5, title: "Validar cache e suporte offline", category: "PWA", completed: false },
];

export const tasks = signal<Task[]>(initialTasks);
export const taskInput = signal<string>("");
export const taskCategory = signal<"Deno" | "PWA" | "Preact" | "BeerCSS">("Deno");
export const taskFilter = signal<"todas" | "pendentes" | "concluidas">("todas");

export const filteredTasks = computed<Task[]>(() => {
  if (taskFilter.value === "pendentes") {
    return tasks.value.filter((t) => !t.completed);
  }
  if (taskFilter.value === "concluidas") {
    return tasks.value.filter((t) => t.completed);
  }
  return tasks.value;
});

export const completedCount = computed<number>(() => {
  return tasks.value.filter((t) => t.completed).length;
});

export const progressPercent = computed<number>(() => {
  if (tasks.value.length === 0) return 0;
  return Math.round((completedCount.value / tasks.value.length) * 100);
});

// ==========================================
// Actions
// ==========================================
export function toggleThemeMode() {
  const modes: Array<"auto" | "light" | "dark"> = ["light", "dark", "auto"];
  const nextIdx = (modes.indexOf(currentThemeMode.value) + 1) % modes.length;
  const nextMode = modes[nextIdx];
  currentThemeMode.value = nextMode;

  const win = window as any;
  if (typeof win.ui === "function") {
    win.ui("mode", nextMode);
  } else {
    document.body.classList.remove("light", "dark", "auto");
    document.body.classList.add(nextMode);
  }
}

export function promptInstallPWA() {
  if (installPrompt.value) {
    installPrompt.value.prompt();
    installPrompt.value.userChoice.then(() => {
      installPrompt.value = null;
    });
  }
}

export function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.value = [
    ...tasks.value,
    {
      id: Date.now(),
      title: text,
      category: taskCategory.value,
      completed: false,
    },
  ];
  taskInput.value = "";
}

export function toggleTask(id: number) {
  tasks.value = tasks.value.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
}

export function deleteTask(id: number) {
  tasks.value = tasks.value.filter((t) => t.id !== id);
}
