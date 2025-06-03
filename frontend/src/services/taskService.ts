// src/services/taskService.ts

const API_BASE_URL = 'http://localhost:3000'; // A porta padrão do NestJS

// Tipos relacionados a Tarefas (movidos de authService ou definidos aqui)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string; // Ou TaskStatus se você importar/definir o enum no frontend
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

// DTO para criar tarefa (espelha o CreateTaskDto do backend)
export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: string; // Ou TaskStatus
}

// Interface para o payload da atualização de status (espelha o UpdateTaskStatusDto do backend)
export interface UpdateTaskStatusPayload {
  status: string; // Ou TaskStatus, se você tiver o enum no frontend
}

export interface UpdateTaskDetailsPayload {
  title?: string;
  description?: string;
  status?: string; 
}


// Função para buscar tarefas (movida de authService.ts)
export const getTasks = async (params?: GetTasksParams): Promise<PaginatedTasksResponse> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Nenhum token de acesso encontrado. Faça login novamente.');
  }
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const queryString = queryParams.toString();

  const response = await fetch(`${API_BASE_URL}/tasks${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      throw new Error('Sessão expirada ou token inválido. Faça login novamente.');
    }
    const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar tarefas' }));
    throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
  }
  return response.json() as Promise<PaginatedTasksResponse>;
};

// Nova função para criar tarefa
export const createTask = async (taskData: CreateTaskPayload): Promise<Task> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Nenhum token de acesso encontrado. Faça login novamente.');
  }

  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro ao criar tarefa' }));
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

export const updateTaskStatus = async (taskId: string, payload: UpdateTaskStatusPayload): Promise<Task> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Nenhum token de acesso encontrado. Faça login novamente.');
  }

  const url = `${API_BASE_URL}/tasks/${taskId}/status`;
  console.log('Enviando PATCH para:', url); 

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      throw new Error('Sessão expirada ou token inválido. Faça login novamente.');
    }
    // Tenta pegar a mensagem de erro do corpo da resposta
    const errorData = await response.json().catch(() => ({ message: 'Erro ao atualizar status da tarefa' }));
    // Se a mensagem do backend for um array (comum com class-validator), pegue a primeira.
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

export const updateTaskDetails = async (taskId: string, payload: UpdateTaskDetailsPayload): Promise<Task> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Nenhum token de acesso encontrado. Faça login novamente.');
  }

  // URL CORRIGIDA:
  const url = `${API_BASE_URL}/tasks/${taskId}`;
  console.log('Enviando PATCH para (updateTaskDetails):', url, 'com payload:', payload); // Log para debug

  const response = await fetch(url, { // Usando a variável url corrigida
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      throw new Error('Sessão expirada ou token inválido. Faça login novamente.');
    }
    const errorData = await response.json().catch(() => ({ message: 'Erro ao atualizar detalhes da tarefa' }));
    const message = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
    throw new Error(message || `Erro HTTP: ${response.status}`);
  }

  return response.json() as Promise<Task>;
};

// src/services/taskService.ts
// ... (API_BASE_URL e outras funções e tipos existentes)

export const deleteTaskById = async (taskId: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Nenhum token de acesso encontrado. Faça login novamente.');
  }

  // URL CORRIGIDA:
  const url = `${API_BASE_URL}/tasks/${taskId}`;
  console.log('Enviando DELETE para:', url); // Mantenha este log para debug, se quiser

  const response = await fetch(url, { // Use a variável url corrigida
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      // 'Content-Type' não é usualmente necessário para DELETE sem corpo
    },
  });

  if (!response.ok) {
    // O backend retorna 204 No Content em caso de sucesso, o que é 'ok' (response.ok === true).
    // Se não for 'ok', houve um erro.
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      throw new Error('Sessão expirada ou token inválido. Faça login novamente.');
    }
    if (response.status === 404) {
      throw new Error('Tarefa não encontrada para remoção.');
    }
    // Para outros erros, tenta pegar a mensagem do corpo, se houver
    // É importante notar que para erros 404, response.json() pode falhar se não houver corpo.
    let errorMessage = `Erro HTTP: ${response.status}`;
    try {
        const errorData = await response.json();
        const messageFromServer = Array.isArray(errorData.message) ? errorData.message[0] : errorData.message;
        if (messageFromServer) errorMessage = messageFromServer;
    } catch (e) {
        // Ignora o erro de parsing do JSON se não houver corpo, mantém a mensagem de erro HTTP.
    }
    throw new Error(errorMessage);
  }

  // Para DELETE com status 204 No Content, não há corpo de resposta JSON para processar.
  // A verificação de response.ok é suficiente. A função pode ser void.
  return;
};