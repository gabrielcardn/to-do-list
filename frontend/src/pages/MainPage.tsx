// src/pages/MainPage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTasks,
  createTask,
  updateTaskStatus,
  updateTaskDetails,
  deleteTaskById, // Importa a função de deletar
  type Task,
  type PaginatedTasksResponse,
  type CreateTaskPayload,
  type UpdateTaskStatusPayload,
  type UpdateTaskDetailsPayload,
} from "../services/taskService";

// Estilos do Modal (podem ser movidos para um arquivo .css dedicado)
const modalOverlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.7)", // Overlay um pouco mais escuro
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyles: React.CSSProperties = {
  backgroundColor: "#ffffff", // Fundo branco para o conteúdo do modal
  color: "#333", // Cor de texto escura para bom contraste
  padding: "25px",
  borderRadius: "8px",
  minWidth: "350px", // Um pouco maior para conforto
  maxWidth: "500px", // Limite máximo
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
};

const formInputStyles: React.CSSProperties = {
  width: "calc(100% - 16px)", // Ajusta para padding interno
  marginBottom: "15px",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "1rem",
};

const formTextareaStyles: React.CSSProperties = {
  ...formInputStyles, // Herda estilos do input
  minHeight: "80px",
  resize: "vertical",
};

const formButtonContainerStyles: React.CSSProperties = {
  textAlign: "right",
  marginTop: "20px",
};

const formButtonStyles: React.CSSProperties = {
  padding: "10px 15px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginLeft: "10px",
};

const primaryButtonStyles: React.CSSProperties = {
  ...formButtonStyles,
  backgroundColor: "#007bff",
  color: "white",
};

const secondaryButtonStyles: React.CSSProperties = {
  ...formButtonStyles,
  backgroundColor: "#6c757d",
  color: "white",
};

// Objeto para status da tarefa no frontend
const TaskFrontendStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
type TaskFrontendStatusValue = typeof TaskFrontendStatus[keyof typeof TaskFrontendStatus];


function MainPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const tasksPerPage = 5;

  const [isTaskFormModalOpen, setIsTaskFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentEditingTask, setCurrentEditingTask] = useState<Task | null>(null);
  const [taskFormTitle, setTaskFormTitle] = useState("");
  const [taskFormDescription, setTaskFormDescription] = useState("");
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const fetchTasks = useCallback(
    async (pageToFetch: number) => {
      setIsLoadingPage(true);
      setPageError(null);
      try {
        const response: PaginatedTasksResponse = await getTasks({
          page: pageToFetch,
          limit: tasksPerPage,
        });
        setTasks(response.data);
        setTotalTasks(response.total);
        setTotalPages(Math.ceil(response.total / response.limit));
        setCurrentPage(response.page);
      } catch (err: any) {
        console.error("Erro ao buscar tarefas:", err);
        setPageError(err.message);
        if (err.message.includes("Nenhum token") || err.message.includes("Sessão expirada")) {
          localStorage.removeItem("accessToken");
          navigate("/login");
        }
      } finally {
        setIsLoadingPage(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchTasks(currentPage);
  }, [fetchTasks, currentPage]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const openAddTaskModal = () => {
    setModalMode("add");
    setCurrentEditingTask(null);
    setTaskFormTitle("");
    setTaskFormDescription("");
    setTaskFormError(null);
    setIsTaskFormModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setModalMode("edit");
    setCurrentEditingTask(task);
    setTaskFormTitle(task.title);
    setTaskFormDescription(task.description || "");
    setTaskFormError(null);
    setIsTaskFormModalOpen(true);
  };

  const closeTaskFormModal = () => {
    setIsTaskFormModalOpen(false);
    setCurrentEditingTask(null);
  };

  const handleTaskFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!taskFormTitle.trim()) {
      setTaskFormError("O título é obrigatório.");
      return;
    }
    setIsSubmittingForm(true);
    setTaskFormError(null);

    try {
      let shouldGoToFirstPage = false;
      if (modalMode === "add") {
        const taskData: CreateTaskPayload = {
          title: taskFormTitle,
          description: taskFormDescription,
        };
        await createTask(taskData);
        shouldGoToFirstPage = true; // Após adicionar, geralmente queremos ver o item (pode estar na primeira página)
      } else if (modalMode === "edit" && currentEditingTask) {
        const taskUpdateData: UpdateTaskDetailsPayload = {
          title: taskFormTitle,
          description: taskFormDescription,
        };
        const updatedTask = await updateTaskDetails(currentEditingTask.id, taskUpdateData);
        setTasks((prevTasks) =>
          prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
      }
      closeTaskFormModal();
      // Se adicionou, e não está na primeira página, vá para a primeira. Senão, apenas re-busque a página atual.
      if (shouldGoToFirstPage && currentPage !== 1) {
        setCurrentPage(1); // Isso disparará o useEffect para chamar fetchTasks(1)
      } else {
        fetchTasks(currentPage); // Re-busca a página atual para consistência de total/etc.
      }
    } catch (err: any) {
      console.error(`Falha ao ${modalMode === "add" ? "criar" : "atualizar"} tarefa:`, err);
      setTaskFormError(
        err.message || `Não foi possível ${modalMode === "add" ? "criar" : "atualizar"} a tarefa.`
      );
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus: TaskFrontendStatusValue =
      task.status === TaskFrontendStatus.DONE
        ? TaskFrontendStatus.PENDING
        : TaskFrontendStatus.DONE;
    const payload: UpdateTaskStatusPayload = { status: newStatus };
    try {
      const updatedTask = await updateTaskStatus(task.id, payload);
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    } catch (err: any) {
      console.error("Falha ao atualizar status da tarefa:", err);
      setPageError(`Erro ao atualizar status: ${err.message}`);
    }
  };

  // Função para deletar tarefa
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Você tem certeza que deseja remover esta tarefa?")) {
      return;
    }
    try {
      await deleteTaskById(taskId);
      setPageError(null); // Limpa erros anteriores
      // Re-busca as tarefas da página atual.
      // Se a lista de tarefas na página atual ficar vazia e não for a primeira página,
      // podemos tentar buscar a página anterior.
      // Se a última tarefa da página atual for removida
      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1); // Isso vai disparar o fetchTasks para a página anterior
      } else {
        fetchTasks(currentPage); // Re-busca a página atual
      }
      alert("Tarefa removida com sucesso!");
    } catch (err: any) {
      console.error('Falha ao remover tarefa:', err);
      setPageError(err.message || 'Não foi possível remover a tarefa.');
    }
  };


  if (isLoadingPage && tasks.length === 0) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Carregando tarefas...</div>;
  }

  if (pageError && tasks.length === 0) {
    return <div style={{ padding: "20px", color: "red", textAlign: "center" }}>Erro ao carregar tarefas: {pageError}</div>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Minha Lista de Tarefas</h1>
        <div>
          <button onClick={openAddTaskModal} style={primaryButtonStyles}>
            Adicionar Nova Tarefa
          </button>
          <button onClick={handleLogout} style={{ ...secondaryButtonStyles, marginLeft: '10px' }}>
            Sair (Logout)
          </button>
        </div>
      </div>

      {isTaskFormModalOpen && (
        <div style={modalOverlayStyles} data-testid="task-form-modal">
          <div style={modalContentStyles}>
            <h2 style={{ marginTop: 0, marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              {modalMode === "add" ? "Nova Tarefa" : "Editar Tarefa"}
            </h2>
            <form onSubmit={handleTaskFormSubmit}>
              <div>
                <label htmlFor="taskFormTitle" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Título:</label>
                <input
                  type="text"
                  id="taskFormTitle"
                  value={taskFormTitle}
                  onChange={(e) => setTaskFormTitle(e.target.value)}
                  disabled={isSubmittingForm}
                  required
                  style={formInputStyles}
                />
              </div>
              <div>
                <label htmlFor="taskFormDescription" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Descrição:</label>
                <textarea
                  id="taskFormDescription"
                  value={taskFormDescription}
                  onChange={(e) => setTaskFormDescription(e.target.value)}
                  disabled={isSubmittingForm}
                  style={formTextareaStyles}
                />
              </div>
              {taskFormError && <p style={{ color: "red", fontSize: "0.9em", marginTop: "10px" }}>{taskFormError}</p>}
              <div style={formButtonContainerStyles}>
                <button
                  type="button"
                  onClick={closeTaskFormModal}
                  disabled={isSubmittingForm}
                  style={secondaryButtonStyles}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmittingForm} style={primaryButtonStyles}>
                  {isSubmittingForm
                    ? "Salvando..."
                    : modalMode === "add"
                    ? "Criar Tarefa"
                    : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoadingPage && tasks.length > 0 && <p style={{textAlign: 'center'}}>Atualizando tarefas...</p>}
      {!isLoadingPage && tasks.length === 0 && !pageError && (
        <p style={{textAlign: 'center', marginTop: '20px'}}>Nenhuma tarefa encontrada. Clique em "Adicionar Nova Tarefa" para começar!</p>
      )}

      {tasks.length > 0 && (
        <>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {tasks.map((task) => (
              <li
                key={task.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  margin: "10px 0",
                  padding: "15px",
                  backgroundColor: task.status === TaskFrontendStatus.DONE ? "#f9f9f9" : "#fff",
                  opacity: task.status === TaskFrontendStatus.DONE ? 0.6 : 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <h3 style={{ marginTop: 0, textDecoration: task.status === TaskFrontendStatus.DONE ? "line-through" : "none", color: task.status === TaskFrontendStatus.DONE ? "#888" : "#333" }}>
                  {task.title}
                </h3>
                <p style={{ color: task.status === TaskFrontendStatus.DONE ? "#999" : "#555", textDecoration: task.status === TaskFrontendStatus.DONE ? "line-through" : "none", whiteSpace: 'pre-wrap' }}>
                  {task.description || "Sem descrição"}
                </p>
                <p style={{ fontSize: "0.9em", color: "#777" }}>
                  Status: <span style={{ fontWeight: 'bold', color: task.status === TaskFrontendStatus.DONE ? 'green' : (task.status === TaskFrontendStatus.IN_PROGRESS ? 'orange' : 'black')}}>{task.status}</span>
                </p>
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => handleToggleTaskStatus(task)} style={{ ...formButtonStyles, backgroundColor: '#28a745', color: 'white', marginRight: '5px'}}>
                    {task.status === TaskFrontendStatus.DONE
                      ? "Reabrir"
                      : "Concluir"}
                  </button>
                  <button onClick={() => openEditTaskModal(task)} style={{ ...formButtonStyles, backgroundColor: '#ffc107', color: 'black', marginRight: '5px'}}>
                    Editar
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} style={{...formButtonStyles, backgroundColor: '#dc3545', color: 'white'}}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "20px", textAlign: 'center' }}>
            <button onClick={handlePreviousPage} disabled={currentPage <= 1 || isLoadingPage} style={secondaryButtonStyles}>
              Anterior
            </button>
            <span style={{ margin: "0 15px", verticalAlign: 'middle' }}>
              Página {currentPage} de {totalPages} (Total: {totalTasks})
            </span>
            <button onClick={handleNextPage} disabled={currentPage >= totalPages || isLoadingPage} style={primaryButtonStyles}>
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default MainPage;