import {
  tasks,
  taskInput,
  categories,
  taskCategory,
  taskFilter,
  filteredTasks,
  completedCount,
  progressPercent,
  isAddingCategory,
  newCategoryInput,
  addCategory,
  addTask,
  toggleTask,
  deleteTask,
  clearCompletedTasks,
} from "../store.ts";

export function TaskCard() {
  return (
    <article class="border">
      <div class="row">
        <div class="max">
          <h5>Gerenciador de Tarefas</h5>
          <div>
            {completedCount.value} de {tasks.value.length} concluídas ({progressPercent.value}%) • Sincronizado no IndexedDB
          </div>
        </div>
        <span class="chip primary">
          <i>storage</i>
          <span>IndexedDB</span>
        </span>
      </div>

      <div class="space"></div>

      <progress class="primary" value={progressPercent.value} max="100"></progress>

      <div class="space"></div>

      <div class="grid">
        <div class="s12 m7">
          <div class="field label border round fill no-margin">
            <input
              type="text"
              value={taskInput.value}
              onInput={(e: any) => (taskInput.value = e.target.value)}
              onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && addTask()}
            />
            <label>Nova tarefa</label>
          </div>
        </div>

        <div class="s8 m3">
          <div class="field suffix border round fill no-margin">
            <select
              value={taskCategory.value}
              onChange={(e: any) => {
                if (e.target.value === "__new__") {
                  isAddingCategory.value = true;
                } else {
                  taskCategory.value = e.target.value;
                }
              }}
            >
              {categories.value.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__new__">+ Nova categoria...</option>
            </select>
            <button
              class="circle transparent"
              type="button"
              onClick={() => (isAddingCategory.value = true)}
              title="Incluir nova categoria"
            >
              <i>add</i>
            </button>
          </div>
        </div>

        <div class="s4 m2">
          <button
            class="responsive primary fill round no-margin"
            onClick={addTask}
            title="Adicionar Tarefa"
          >
            <i>add</i>
            <span>Criar</span>
          </button>
        </div>
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

      {completedCount.value > 0 && (
        <>
          <div class="space"></div>
          <div class="row right-align">
            <button class="chip border" onClick={clearCompletedTasks}>
              <i>clear_all</i>
              <span>Limpar concluídas</span>
            </button>
          </div>
        </>
      )}

      {/* Modal elegante para criação de novas categorias */}
      <dialog class={isAddingCategory.value ? "active" : ""}>
        <h5>Nova Categoria</h5>
        <div>Crie uma categoria personalizada para organizar suas tarefas</div>
        <div class="space"></div>
        <div class="field label border round fill">
          <input
            type="text"
            value={newCategoryInput.value}
            onInput={(e: any) => (newCategoryInput.value = e.target.value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && addCategory()}
            placeholder="Ex: API, DevOps, Testes..."
          />
          <label>Nome da categoria</label>
        </div>
        <div class="space"></div>
        <nav class="right-align">
          <button
            class="border"
            type="button"
            onClick={() => {
              isAddingCategory.value = false;
              newCategoryInput.value = "";
            }}
          >
            Cancelar
          </button>
          <button class="primary" type="button" onClick={() => addCategory()}>
            Salvar
          </button>
        </nav>
      </dialog>
    </article>
  );
}
