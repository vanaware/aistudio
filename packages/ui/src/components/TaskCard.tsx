import {
  tasks,
  taskInput,
  taskFilter,
  filteredTasks,
  completedCount,
  progressPercent,
  addTask,
  toggleTask,
  deleteTask,
} from "../store.ts";

export function TaskCard() {
  return (
    <article class="border">
      <div class="row">
        <div class="max">
          <h5>Gerenciador de Tarefas</h5>
          <div>
            {completedCount.value} de {tasks.value.length} concluídas ({progressPercent.value}%)
          </div>
        </div>
        <span class="badge circle primary">{tasks.value.length}</span>
      </div>

      <div class="space"></div>

      <progress class="primary" value={progressPercent.value} max="100"></progress>

      <div class="space"></div>

      <div class="row">
        <div class="field label border round fill max">
          <input
            type="text"
            value={taskInput.value}
            onInput={(e: any) => (taskInput.value = e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && addTask()}
          />
          <label>Nova tarefa</label>
        </div>

        <button class="circle primary" onClick={addTask} title="Adicionar Tarefa">
          <i>add</i>
        </button>
      </div>

      <nav class="tabs">
        <a
          class={taskFilter.value === "todas" ? "active" : ""}
          onClick={() => (taskFilter.value = "todas")}
        >
          <i>list</i>
          <span>Todas ({tasks.value.length})</span>
        </a>
        <a
          class={taskFilter.value === "pendentes" ? "active" : ""}
          onClick={() => (taskFilter.value = "pendentes")}
        >
          <i>pending</i>
          <span>Pendentes</span>
        </a>
        <a
          class={taskFilter.value === "concluidas" ? "active" : ""}
          onClick={() => (taskFilter.value = "concluidas")}
        >
          <i>check_circle</i>
          <span>Concluídas</span>
        </a>
      </nav>

      <div class="space"></div>

      {filteredTasks.value.map((task) => (
        <div key={task.id} class="row wave surface-container round">
          <label class="checkbox">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span></span>
          </label>

          <div class="max">
            <h6 class={task.completed ? "line-through opacity" : ""}>{task.title}</h6>
            <div>{task.category}</div>
          </div>

          <button class="circle transparent" onClick={() => deleteTask(task.id)} title="Excluir">
            <i>delete</i>
          </button>
        </div>
      ))}
    </article>
  );
}
