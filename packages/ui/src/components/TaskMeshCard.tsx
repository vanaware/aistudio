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

export function TaskMeshCard() {
  return (
    <article class="border round medium-elevate">
      <div class="row">
        <div class="max">
          <h5 class="bold">Gerenciador de Tarefas</h5>
          <p class="secondary-text">Progresso: {completedCount.value} de {tasks.value.length} concluidas ({progressPercent.value}%)</p>
        </div>
        <span class="badge primary circle min">{tasks.value.length}</span>
      </div>

      <progress class="primary" value={progressPercent.value} max="100"></progress>

      <div class="row">
        <div class="field label border round fill max">
          <input
            type="text"
            value={taskInput.value}
            onInput={(e: any) => (taskInput.value = e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && addTask()}
          />
          <label>Adicionar nova tarefa</label>
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
          <span>Pendentes ({tasks.value.length - completedCount.value})</span>
        </a>
        <a
          class={taskFilter.value === "concluidas" ? "active" : ""}
          onClick={() => (taskFilter.value = "concluidas")}
        >
          <i>check_circle</i>
          <span>Concluídas ({completedCount.value})</span>
        </a>
      </nav>

      <div class="space"></div>

      {filteredTasks.value.map((task) => (
        <div key={task.id} class="row wave border round surface-container margin-bottom">
          <label class="checkbox">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            <span></span>
          </label>

          <div class="max">
            <div class={task.completed ? "bold line-through secondary-text" : "bold"}>
              {task.title}
            </div>
            <span class="chip tiny secondary">{task.category}</span>
          </div>

          <button class="circle transparent" onClick={() => deleteTask(task.id)} title="Excluir">
            <i>delete</i>
          </button>
        </div>
      ))}
    </article>
  );
}
