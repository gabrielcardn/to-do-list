import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import {
  getTasks,
  createTask,
  type Task,
  type PaginatedTasksResponse,
  type CreateTaskPayload,
  type GetTasksParams,
} from "./taskService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

describe("taskService", () => {
  const mockToken = "mock-access-token";

  beforeEach(() => {
    const fetchMockFunc = vi.fn();
    vi.stubGlobal("fetch", fetchMockFunc);
    localStorage.setItem("accessToken", mockToken);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe("getTasks", () => {
    const mockPaginatedResponse: PaginatedTasksResponse = {
      data: [
        {
          id: "task1",
          title: "Tarefa 1",
          description: "Desc 1",
          status: "PENDING",
          userId: "user1",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    };

    it("should fetch tasks successfully with a token", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPaginatedResponse,
      } as unknown as Response);

      const params: GetTasksParams = { page: 1, limit: 10 };
      const result = await getTasks(params);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tasks?page=1&limit=10`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it("should throw an error if no access token is found", async () => {
      localStorage.removeItem("accessToken");
      await expect(getTasks()).rejects.toThrow(
        "Nenhum token de acesso encontrado. Faça login novamente."
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should throw an error if API call fails", async () => {
      const errorMessage = "Failed to fetch tasks";
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: errorMessage }),
      } as unknown as Response);

      await expect(getTasks()).rejects.toThrow(errorMessage);
    });

    it("should handle 401 error by removing token and throwing specific error", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: "Unauthorized" }),
      } as unknown as Response);

      const initialToken = localStorage.getItem("accessToken");
      expect(initialToken).toBe(mockToken);

      await expect(getTasks()).rejects.toThrow(
        "Sessão expirada ou token inválido. Faça login novamente."
      );

      const tokenAfterError = localStorage.getItem("accessToken");
      expect(tokenAfterError).toBeNull();
    });
  });

  describe("createTask", () => {
    const mockTaskPayload: CreateTaskPayload = {
      title: "Nova Tarefa",
      description: "Detalhes da nova tarefa",
    };
    const mockCreatedTask: Task = {
      id: "task-new-uuid",
      title: "Nova Tarefa",
      description: "Detalhes da nova tarefa",
      status: "PENDING",
      userId: "user-uuid-123",
    };

    it("should create a task successfully with a token", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockCreatedTask,
      } as unknown as Response);

      const result = await createTask(mockTaskPayload);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mockToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockTaskPayload),
      });
      expect(result).toEqual(mockCreatedTask);
    });

    it("should throw an error if no access token is found", async () => {
      localStorage.removeItem("accessToken");
      await expect(createTask(mockTaskPayload)).rejects.toThrow(
        "Nenhum token de acesso encontrado. Faça login novamente."
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should throw an error if API call fails to create task", async () => {
      const errorMessage = "Validation failed";
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: errorMessage }),
      } as unknown as Response);

      await expect(createTask(mockTaskPayload)).rejects.toThrow(errorMessage);
    });
  });
});
