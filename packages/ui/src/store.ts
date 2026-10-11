import { signal, computed } from "@preact/signals";
import { get, set } from "idb-keyval";

// ==========================================
// PWA & Environment Signals
// ==========================================
export const isOnline = signal<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
export const swActive = signal<boolean>(false);
export const installPrompt = signal<any>(null);
export const currentThemeMode = signal<"auto" | "light" | "dark">("auto");
export const isStorageLoaded = signal<boolean>(false);

export function initEnvironmentListeners() {
  // Load persisted data from IndexedDB
  loadTasksFromStorage();
  loadCategoriesFromStorage();

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
        .register("./sw.js")
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
// Reactive App Signals: Tasks (IndexedDB Persisted)
// ==========================================
export interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
}

export const STORAGE_KEY = "aistudio_tasks";
export const CATEGORIES_STORAGE_KEY = "aistudio_categories";

export const defaultCategories: string[] = ["Deno", "PWA", "Preact", "BeerCSS"];
export const categories = signal<string[]>(defaultCategories);
export const isAddingCategory = signal<boolean>(false);
export const newCategoryInput = signal<string>("");

const defaultTasks: Task[] = [
  { id: 1, title: "Configurar Deno.bundle nativo", category: "Deno", completed: true },
  { id: 2, title: "Registrar Service Worker offline", category: "PWA", completed: true },
  { id: 3, title: "Migrar estado reativo para Signals", category: "Preact", completed: true },
  { id: 4, title: "Aplicar Material Design 3 com BeerCSS", category: "BeerCSS", completed: true },
  { id: 5, title: "Persistir tarefas com idb-keyval no IndexedDB", category: "Deno", completed: true },
  { id: 6, title: "Validar cache e suporte offline", category: "PWA", completed: false },
];

export const tasks = signal<Task[]>(defaultTasks);
export const taskInput = signal<string>("");
export const taskCategory = signal<string>("Deno");
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
// IndexedDB Persistence Actions (idb-keyval)
// ==========================================
export async function loadTasksFromStorage(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    isStorageLoaded.value = true;
    return;
  }
  try {
    const stored = await get<Task[]>(STORAGE_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      tasks.value = stored;
    }
  } catch (err) {
    console.warn("[Store] Erro ao carregar tarefas do IndexedDB:", err);
  } finally {
    isStorageLoaded.value = true;
  }
}

export async function persistTasks(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await set(STORAGE_KEY, tasks.value);
  } catch (err) {
    console.warn("[Store] Erro ao persistir tarefas no IndexedDB:", err);
  }
}

export async function loadCategoriesFromStorage(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const stored = await get<string[]>(CATEGORIES_STORAGE_KEY);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const merged = Array.from(new Set([...defaultCategories, ...stored]));
      categories.value = merged;
    }
  } catch (err) {
    console.warn("[Store] Erro ao carregar categorias do IndexedDB:", err);
  }
}

export async function persistCategories(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    await set(CATEGORIES_STORAGE_KEY, categories.value);
  } catch (err) {
    console.warn("[Store] Erro ao persistir categorias no IndexedDB:", err);
  }
}

// ==========================================
// Theme & PWA Actions
// ==========================================
export function toggleThemeMode() {
  const modes: Array<"auto" | "light" | "dark"> = ["light", "dark", "auto"];
  const nextIdx = (modes.indexOf(currentThemeMode.value) + 1) % modes.length;
  const nextMode = modes[nextIdx] ?? "auto";
  currentThemeMode.value = nextMode;

  if (typeof globalThis !== "undefined" && "document" in globalThis) {
    const win = globalThis as any;
    if (typeof win.ui === "function") {
      win.ui("mode", nextMode);
    } else if (win.document?.body) {
      win.document.body.classList.remove("light", "dark", "auto");
      win.document.body.classList.add(nextMode);
    }
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

// ==========================================
// Task & Category Management Actions
// ==========================================
export function addCategory(name?: string) {
  const catName = (name || newCategoryInput.value).trim();
  if (!catName) return;
  if (!categories.value.includes(catName)) {
    categories.value = [...categories.value, catName];
    persistCategories();
  }
  taskCategory.value = catName;
  newCategoryInput.value = "";
  isAddingCategory.value = false;
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
  persistTasks();
}

export function toggleTask(id: number) {
  tasks.value = tasks.value.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  persistTasks();
}

export function deleteTask(id: number) {
  tasks.value = tasks.value.filter((t) => t.id !== id);
  persistTasks();
}

export function clearCompletedTasks() {
  tasks.value = tasks.value.filter((t) => !t.completed);
  persistTasks();
}
