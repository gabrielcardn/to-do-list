const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  userId: string;
}

export interface PaginatedTasksResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface GetTasksParams {
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string;
}

export interface UpdateTaskStatusPayload {
  status: string;
}

export interface UpdateTaskDetailsPayload {
  title?: string;
  description?: string;
  status?: string;
}

export const getTasks = async (params?: GetTasksParams): Promise<PaginatedTasksResponse> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  const queryString = queryParams.toString();

  const response = await fetch(`${API_BASE_URL}/tasks${queryString ? `?${queryString}` : ""}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
    }
    const errorData = await response.json().catch(() => ({ message: "Erro ao buscar tarefas" }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }
  return response.json() as Promise<PaginatedTasksResponse>;
};

export const createTask = async (taskData: CreateTaskPayload): Promise<Task> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }

  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro ao criar tarefa" }));
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

export const updateTaskStatus = async (
  taskId: string,
  payload: UpdateTaskStatusPayload
): Promise<Task> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }

  const url = `${API_BASE_URL}/tasks/${taskId}/status`;
  console.log("Enviando PATCH para:", url);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
    }

    const errorData = await response
      .json()
      .catch(() => ({ message: "Erro ao atualizar status da tarefa" }));

    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

export const updateTaskDetails = async (
  taskId: string,
  payload: UpdateTaskDetailsPayload
): Promise<Task> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }

  const url = `${API_BASE_URL}/tasks/${taskId}`;
  console.log("Enviando PATCH para (updateTaskDetails):", url, "com payload:", payload);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
    }
    const errorData = await response
      .json()
      .catch(() => ({ message: "Erro ao atualizar detalhes da tarefa" }));
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

export const deleteTaskById = async (taskId: string): Promise<void> => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }

  const url = `${API_BASE_URL}/tasks/${taskId}`;
  console.log("Enviando DELETE para:", url);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
    }
    if (response.status === 404) {
      throw new Error("Tarefa não encontrada para remoção.");
    }

    let errorMessage = `Erro HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      const messageFromServer = Array.isArray(errorData.message)
        ? errorData.message[0]
        : errorData.message;
      if (messageFromServer) errorMessage = messageFromServer;
    } catch (e) {}
    throw new Error(errorMessage);
  }

  return;
};
