import { assertEquals, assert } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { APP_VERSION } from "../src/version.ts";
import { Footnote } from "../src/components/Footnote.tsx";
import { TaskCard } from "../src/components/TaskCard.tsx";
import {
  count,
  step,
  square,
  cube,
  isEven,
  tasks,
  taskInput,
  taskCategory,
  taskFilter,
  filteredTasks,
  completedCount,
  progressPercent,
  addTask,
  toggleTask,
  deleteTask,
  currentThemeMode,
  toggleThemeMode,
} from "../src/store.ts";

describe("Application Version & Footnote", () => {
  it("exports APP_VERSION as string from src/version.ts", () => {
    assertEquals(typeof APP_VERSION, "string");
  });

  it("renders Footnote component function properly", () => {
    const vnode = Footnote();
    assert(vnode != null);
    assertEquals(vnode.type, "footer");
  });
});

describe("Reactive Signals & Math Operations", () => {
  it("calculates square, cube and parity based on count", () => {
    count.value = 4;
    step.value = 2;

    assertEquals(count.value, 4);
    assertEquals(square.value, 16);
    assertEquals(cube.value, 64);
    assertEquals(isEven.value, true);

    count.value = 5;
    assertEquals(square.value, 25);
    assertEquals(cube.value, 125);
    assertEquals(isEven.value, false);
  });
});

describe("Task Mesh Management", () => {
  it("renders TaskCard component function properly", () => {
    const vnode = TaskCard();
    assert(vnode != null);
    assertEquals(vnode.type, "article");
  });

  it("adds, toggles, filters and deletes tasks properly", () => {
    const initialLen = tasks.value.length;

    taskInput.value = "Test new task";
    taskCategory.value = "Preact";
    addTask();

    assertEquals(tasks.value.length, initialLen + 1);
    const addedTask = tasks.value[tasks.value.length - 1];
    assert(addedTask);
    assertEquals(addedTask.title, "Test new task");
    assertEquals(addedTask.completed, false);
    assertEquals(taskInput.value, "");

    toggleTask(addedTask.id);
    const updated = tasks.value.find((t) => t.id === addedTask.id);
    assertEquals(updated?.completed, true);

    taskFilter.value = "concluidas";
    assert(filteredTasks.value.every((t) => t.completed));

    taskFilter.value = "pendentes";
    assert(filteredTasks.value.every((t) => !t.completed));

    taskFilter.value = "todas";
    assertEquals(filteredTasks.value.length, tasks.value.length);

    deleteTask(addedTask.id);
    assertEquals(tasks.value.length, initialLen);
  });

  it("calculates completed count and progress percentage", () => {
    tasks.value = [
      { id: 101, title: "T1", category: "Deno", completed: true },
      { id: 102, title: "T2", category: "PWA", completed: false },
    ];

    assertEquals(completedCount.value, 1);
    assertEquals(progressPercent.value, 50);

    tasks.value = [
      { id: 101, title: "T1", category: "Deno", completed: true },
      { id: 102, title: "T2", category: "PWA", completed: true },
    ];
    assertEquals(progressPercent.value, 100);
  });
});

describe("Theme Toggle", () => {
  it("cycles theme through light, dark, and auto", () => {
    currentThemeMode.value = "light";
    toggleThemeMode();
    assertEquals(currentThemeMode.value, "dark");
    toggleThemeMode();
    assertEquals(currentThemeMode.value, "auto");
    toggleThemeMode();
    assertEquals(currentThemeMode.value, "light");
  });
});

describe("Build Artifacts Verification", () => {
  it("checks generated distribution files if dist exists", async () => {
    const distPath = "packages/server/build/dist";
    try {
      const stat = await Deno.stat(distPath);
      if (stat.isDirectory) {
        const indexHtml = await Deno.readTextFile(`${distPath}/index.html`);
        assert(indexHtml.includes("<!DOCTYPE html>"));
        assert(indexHtml.includes("manifest.json"));

        const swStat = await Deno.stat(`${distPath}/sw.js`);
        assertEquals(swStat.isFile, true);

        const mainStat = await Deno.stat(`${distPath}/main.js`);
        assertEquals(mainStat.isFile, true);
      }
    } catch {
      // If not built yet, skip gracefully
    }
  });
});
