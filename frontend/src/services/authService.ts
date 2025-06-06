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
