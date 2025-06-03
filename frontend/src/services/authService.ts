// src/services/authService.ts

// URL base da sua API backend
// Certifique-se de que seu backend NestJS esteja rodando nesta URL e porta
const API_BASE_URL = "http://localhost:3000"; // A porta padrão do NestJS

export interface LoginResponse {
  access_token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// DTO para criar usuário (espelha o CreateUserDto do backend)
export interface CreateUserDto {
  username: string;
  password: string;
  // O backend não espera confirmPassword, a validação é só no frontend
}

// Tipo para a resposta do registro (espelha o UserProfile do backend)
export interface UserProfile {
  id: string;
  username: string;
  // não inclui a senha
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
    // Se a resposta não for OK (ex: 401 Unauthorized, 400 Bad Request),
    // tentamos pegar a mensagem de erro do corpo da resposta, se houver.
    const errorData = await response.json().catch(() => ({ message: "Erro ao fazer login" }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<LoginResponse>;
};

// Nova função para registrar usuário
export const registerUser = async (userData: CreateUserDto): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    // Tenta pegar a mensagem de erro do corpo da resposta
    // O backend NestJS geralmente envia um objeto com statusCode, message, error
    const errorData = await response.json().catch(() => ({ message: "Erro ao registrar" }));
    // Se a mensagem do backend for um array (comum com class-validator), pegue a primeira.
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<UserProfile>;
};

//
export interface Task {
  // Definindo a interface para uma tarefa no frontend
  id: string;
  title: string;
  description: string;
  status: string; // Ou TaskStatus se você importar/definir o enum no frontend
  userId: string;
}

export interface PaginatedTasksResponse {
  // Resposta da API de listagem de tarefas
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface GetTasksParams {
  // Parâmetros para a função getTasks
  page?: number;
  limit?: number;
}

export const getTasks = async (params?: GetTasksParams): Promise<PaginatedTasksResponse> => {
  const token = localStorage.getItem("accessToken"); // Pega o token do localStorage
  if (!token) {
    throw new Error("Nenhum token de acesso encontrado. Faça login novamente.");
  }

  // Constrói a query string para paginação, se os parâmetros forem fornecidos
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
      // Poderia limpar o token e redirecionar para login aqui
      localStorage.removeItem("accessToken");
      throw new Error("Sessão expirada ou token inválido. Faça login novamente.");
    }
    const errorData = await response.json().catch(() => ({ message: "Erro ao buscar tarefas" }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<PaginatedTasksResponse>;
};
