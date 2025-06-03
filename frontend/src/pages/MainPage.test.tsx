// src/pages/MainPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react"; // Adicione 'within'
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import MainPage from "./MainPage";
import * as taskService from "../services/taskService";
import type { Task, PaginatedTasksResponse } from "../services/taskService";

// Mock completo para o módulo taskService
vi.mock("../services/taskService", () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTaskDetails: vi.fn(),
  deleteTaskById: vi.fn(),
}));

// Mock para useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock para window.confirm
const mockConfirm = vi.fn();
vi.stubGlobal("confirm", mockConfirm);

// Objeto para status da tarefa no frontend (copiado de MainPage.tsx para uso nos testes)
const TaskFrontendStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
// type TaskFrontendStatusValue = typeof TaskFrontendStatus[keyof typeof TaskFrontendStatus]; // Se precisar do tipo

// Constante para tasksPerPage usada no componente MainPage e nos mocks
const TASKS_PER_PAGE_IN_COMPONENT = 5;

// Dados mockados consistentes com TASKS_PER_PAGE_IN_COMPONENT = 5
const mockTasksForPage1: Task[] = Array.from({ length: TASKS_PER_PAGE_IN_COMPONENT }, (_, i) => ({
  id: `t${i + 1}`,
  title: `Tarefa ${i + 1} da Página 1`,
  description: `Descrição da Tarefa ${i + 1}`,
  status: i % 2 === 0 ? TaskFrontendStatus.PENDING : TaskFrontendStatus.DONE, // Alternando status para variedade
  userId: "user1",
}));

const mockTasksForPage2: Task[] = [
  {
    id: `t${TASKS_PER_PAGE_IN_COMPONENT + 1}`,
    title: `Tarefa ${TASKS_PER_PAGE_IN_COMPONENT + 1} da Página 2`,
    description: "Desc P2T1",
    status: TaskFrontendStatus.PENDING,
    userId: "user1",
  },
];

const totalMockTasks = mockTasksForPage1.length + mockTasksForPage2.length; // Total 6 tarefas

const mockPaginatedResponsePage1: PaginatedTasksResponse = {
  data: mockTasksForPage1,
  total: totalMockTasks,
  page: 1,
  limit: TASKS_PER_PAGE_IN_COMPONENT,
};

const mockPaginatedResponsePage2: PaginatedTasksResponse = {
  data: mockTasksForPage2,
  total: totalMockTasks,
  page: 2,
  limit: TASKS_PER_PAGE_IN_COMPONENT,
};

const emptyTasksResponse: PaginatedTasksResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: TASKS_PER_PAGE_IN_COMPONENT,
};

describe("MainPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("accessToken", "fake-token");
    (taskService.getTasks as Mock).mockResolvedValue(emptyTasksResponse); // Mock padrão inicial
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should render loading state initially and then display tasks", async () => {
    (taskService.getTasks as Mock).mockResolvedValueOnce(mockPaginatedResponsePage1);

    render(
      <BrowserRouter>
        <MainPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/carregando tarefas.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(mockTasksForPage1[0].title)).toBeInTheDocument();
      expect(screen.getByText(mockTasksForPage1[1].title)).toBeInTheDocument();
    });
    expect(taskService.getTasks).toHaveBeenCalledWith({
      page: 1,
      limit: TASKS_PER_PAGE_IN_COMPONENT,
    });
    expect(screen.queryByText(/carregando tarefas.../i)).not.toBeInTheDocument();
  });

  it('should display "Nenhuma tarefa encontrada" when no tasks are fetched', async () => {
    // beforeEach já configura getTasks para emptyTasksResponse
    render(
      <BrowserRouter>
        <MainPage />
      </BrowserRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/nenhuma tarefa encontrada/i)).toBeInTheDocument();
    });
  });

  it("should handle logout correctly", async () => {
    render(
      <BrowserRouter>
        <MainPage />
      </BrowserRouter>
    );
    await waitFor(() => expect(taskService.getTasks).toHaveBeenCalled());

    const logoutButton = screen.getByRole("button", { name: /sair \(logout\)/i });
    await user.click(logoutButton);

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  describe("Add Task Modal", () => {
    const newTaskTitle = "Nova Tarefa Adicionada Pelo Teste";
    const newTaskDescription = "Descrição da Adição Pelo Teste";
    const createdTask: Task = {
      id: "newTask123",
      title: newTaskTitle,
      description: newTaskDescription,
      status: TaskFrontendStatus.PENDING,
      userId: "user1",
    };

 it('should open add task modal, submit, call createTask, close modal, and refresh list', async () => {
        (taskService.getTasks as Mock)
          .mockResolvedValueOnce(emptyTasksResponse)
          .mockResolvedValueOnce({
            data: [createdTask], 
            total: 1, 
            page: 1, 
            limit: TASKS_PER_PAGE_IN_COMPONENT
          });
        (taskService.createTask as Mock).mockResolvedValue(createdTask);

        render(<BrowserRouter><MainPage /></BrowserRouter>);
        await waitFor(() => expect(screen.getByText(/nenhuma tarefa encontrada/i)).toBeInTheDocument());
        expect(taskService.getTasks).toHaveBeenCalledTimes(1);

        const addTaskButton = screen.getByRole('button', { name: /adicionar nova tarefa/i });
        await user.click(addTaskButton);
        
        // Verifica se o modal abriu com o título exato "Nova Tarefa"
        expect(screen.getByRole('heading', { name: /^Nova Tarefa$/i })).toBeInTheDocument();

        await user.type(screen.getByLabelText(/título/i), newTaskTitle); // newTaskTitle é "Nova Tarefa Adicionada Pelo Teste"
        await user.type(screen.getByLabelText(/descrição/i), newTaskDescription);
        
        const saveButton = screen.getByRole('button', { name: /criar tarefa/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(taskService.createTask).toHaveBeenCalledWith({ title: newTaskTitle, description: newTaskDescription });
        });
        
        await waitFor(() => {
            expect(taskService.getTasks).toHaveBeenCalledTimes(2); 
        });

        // Verifica se o TÍTULO DO MODAL ("Nova Tarefa") desapareceu.
        await waitFor(() => {
            // console.log("DOM no momento da verificação de fechamento do modal:");
            // screen.debug(undefined, 300000);
            expect(screen.queryByRole("heading", { name: /^Nova Tarefa$/i })).not.toBeInTheDocument();
        });

        await waitFor(() => {
            // Verifica se o título da TAREFA CRIADA ("Nova Tarefa Adicionada Pelo Teste") está na lista.
            expect(screen.getByText(newTaskTitle)).toBeInTheDocument();
        });
    });
  });

  describe("Edit Task Modal", () => {
    const taskToEdit = mockTasksForPage1[0]; // "Tarefa 1 Teste"
    const newEditedTitle = "Título Realmente Editado Agora";

    const taskAsReturnedByApiUpdate = { ...taskToEdit, title: newEditedTitle };

    const tasksAfterRefetchIncludingEdit = [
      taskAsReturnedByApiUpdate, // Tarefa com o título atualizado
      mockTasksForPage1[1],
      mockTasksForPage1[2],
      mockTasksForPage1[3],
      mockTasksForPage1[4],
    ];
    const paginatedResponseAfterEditRefetch: PaginatedTasksResponse = {
      data: tasksAfterRefetchIncludingEdit,
      total: mockPaginatedResponsePage1.total,
      page: mockPaginatedResponsePage1.page,
      limit: mockPaginatedResponsePage1.limit,
    };

    it("should open edit modal, submit, call updateTaskDetails, and refresh UI with updated task", async () => {
      (taskService.getTasks as Mock)
        .mockResolvedValueOnce(mockPaginatedResponsePage1) // 1. Carga inicial
        .mockResolvedValueOnce(paginatedResponseAfterEditRefetch); // 2. Chamada por fetchTasks DEPOIS do submit do modal
      (taskService.updateTaskDetails as Mock).mockResolvedValue(taskAsReturnedByApiUpdate);

      render(
        <BrowserRouter>
          <MainPage />
        </BrowserRouter>
      );
      await waitFor(() => expect(screen.getByText(taskToEdit.title)).toBeInTheDocument());

      // Encontra todos os botões "Editar" e clica no primeiro
      const editButtons = await screen.findAllByRole("button", { name: /editar/i });
      await user.click(editButtons[0]);

      expect(screen.getByRole("heading", { name: /editar tarefa/i })).toBeInTheDocument();
      const titleInput = screen.getByLabelText(/título/i) as HTMLInputElement;
      expect(titleInput.value).toBe(taskToEdit.title);

      await user.clear(titleInput);
      await user.type(titleInput, newEditedTitle);

      const saveButton = screen.getByRole("button", { name: /salvar alterações/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(taskService.updateTaskDetails).toHaveBeenCalledWith(taskToEdit.id, {
          title: newEditedTitle,
          description: taskToEdit.description,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(newEditedTitle)).toBeInTheDocument();
      });
      expect(taskService.getTasks).toHaveBeenCalledTimes(2);
    });
  });

  describe("Toggle Task Status", () => {
    it("should call updateTaskStatus and update UI when toggling status to DONE", async () => {
      const taskToToggle = { ...mockTasksForPage1[0], status: TaskFrontendStatus.PENDING };
      const updatedTaskDone = { ...taskToToggle, status: TaskFrontendStatus.DONE };

      (taskService.getTasks as Mock).mockResolvedValueOnce({
        data: [taskToToggle, mockTasksForPage1[1]],
        total: 2,
        page: 1,
        limit: TASKS_PER_PAGE_IN_COMPONENT,
      });
      (taskService.updateTaskStatus as Mock).mockResolvedValue(updatedTaskDone);

      render(
        <BrowserRouter>
          <MainPage />
        </BrowserRouter>
      );
      await waitFor(() => expect(screen.getByText(taskToToggle.title)).toBeInTheDocument());

      const toggleButton = (await screen.findAllByRole("button", { name: /concluir/i }))[0];
      await user.click(toggleButton);

      await waitFor(() => {
        expect(taskService.updateTaskStatus).toHaveBeenCalledWith(taskToToggle.id, {
          status: TaskFrontendStatus.DONE,
        });
      });

      await waitFor(() => {
        const taskTitleElement = screen.getByText(updatedTaskDone.title);
        const listItem = taskTitleElement.closest("li");
        expect(taskTitleElement).toHaveStyle("text-decoration: line-through");
        expect(listItem).toHaveStyle("background-color: rgb(249, 249, 249)");

        // CORREÇÃO AQUI: Use 'within' para buscar dentro do listItem
        if (listItem) {
          // Adiciona uma verificação para garantir que listItem não é null
          const reabrirButton = within(listItem).getByRole("button", { name: /reabrir/i });
          expect(reabrirButton).toBeInTheDocument();
        } else {
          throw new Error("List item não encontrado para a tarefa atualizada."); // Ou falhe o teste de outra forma
        }
      });
    });
  });

  describe("Delete Task", () => {
    const taskToDelete = mockTasksForPage1[0]; // "Tarefa 1 Teste"
    const remainingTask = mockTasksForPage1[1]; // "Tarefa 2 Teste"

    it("should call deleteTaskById after confirmation and refresh list", async () => {
      (taskService.getTasks as Mock)
        .mockResolvedValueOnce(mockPaginatedResponsePage1) // Carga inicial
        .mockResolvedValueOnce({
          // Após deletar e chamar fetchTasks
          data: [remainingTask],
          total: mockPaginatedResponsePage1.total - 1,
          page: 1,
          limit: TASKS_PER_PAGE_IN_COMPONENT,
        });
      (taskService.deleteTaskById as Mock).mockResolvedValue(undefined);
      mockConfirm.mockReturnValue(true);

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <BrowserRouter>
          <MainPage />
        </BrowserRouter>
      );
      await waitFor(() => expect(screen.getByText(taskToDelete.title)).toBeInTheDocument());

      const deleteButtons = await screen.findAllByRole("button", { name: /remover/i });
      // Assume que o botão de remover da primeira tarefa é o primeiro encontrado
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith("Você tem certeza que deseja remover esta tarefa?");

      await waitFor(() => {
        expect(taskService.deleteTaskById).toHaveBeenCalledWith(taskToDelete.id);
      });

      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalledTimes(2);
      });
      expect(alertSpy).toHaveBeenCalledWith("Tarefa removida com sucesso!");

      await waitFor(() => {
        expect(screen.queryByText(taskToDelete.title)).not.toBeInTheDocument();
        expect(screen.getByText(remainingTask.title)).toBeInTheDocument();
      });
      alertSpy.mockRestore();
    });

    it("should not call deleteTaskById if confirmation is cancelled", async () => {
      (taskService.getTasks as Mock).mockResolvedValue(mockPaginatedResponsePage1);
      mockConfirm.mockReturnValue(false);

      render(
        <BrowserRouter>
          <MainPage />
        </BrowserRouter>
      );
      await waitFor(() => expect(screen.getByText(taskToDelete.title)).toBeInTheDocument());

      const deleteButtons = await screen.findAllByRole("button", { name: /remover/i });
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith("Você tem certeza que deseja remover esta tarefa?");
      expect(taskService.deleteTaskById).not.toHaveBeenCalled();
    });
  });

  describe("Pagination", () => {
    it('should fetch next page when "Próxima" is clicked', async () => {
      (taskService.getTasks as Mock)
        .mockResolvedValueOnce(mockPaginatedResponsePage1) // Carga inicial da página 1 (total 6, limit 5 -> 2 páginas)
        .mockResolvedValueOnce(mockPaginatedResponsePage2); // Mock para quando clicar em "Próxima"

      render(
        <BrowserRouter>
          <MainPage />
        </BrowserRouter>
      );

      await waitFor(() => expect(screen.getByText(mockTasksForPage1[0].title)).toBeInTheDocument());
      expect(screen.getByText(/Página 1 de 2 \(Total: 6\)/i)).toBeInTheDocument();

      const nextButton = screen.getByRole("button", { name: /próxima/i });
      await user.click(nextButton);

      await waitFor(() => expect(screen.getByText(mockTasksForPage2[0].title)).toBeInTheDocument());
      expect(taskService.getTasks).toHaveBeenNthCalledWith(1, {
        page: 1,
        limit: TASKS_PER_PAGE_IN_COMPONENT,
      });
      expect(taskService.getTasks).toHaveBeenNthCalledWith(2, {
        page: 2,
        limit: TASKS_PER_PAGE_IN_COMPONENT,
      });

      expect(screen.getByText(/Página 2 de 2 \(Total: 6\)/i)).toBeInTheDocument();
    });
  });
});
