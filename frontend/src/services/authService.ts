const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface LoginResponse {
  access_token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro ao fazer login" }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<LoginResponse>;
};

export const registerUser = async (userData: CreateUserDto): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Erro ao registrar" }));

    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<UserProfile>;
};

//
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
