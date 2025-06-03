import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import {
  loginUser,
  registerUser,
  type LoginCredentials,
  type LoginResponse,
  type CreateUserDto,
  type UserProfile,
} from "./authService";

describe("authService", () => {
  beforeEach(() => {
    const fetchMockFunc = vi.fn(); // Use um nome diferente para a função mock criada
    vi.stubGlobal("fetch", fetchMockFunc); // 'fetch' global agora é fetchMockFunc
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("loginUser", () => {
    const mockCredentials: LoginCredentials = { username: "test", password: "password" };
    const mockLoginResponse: LoginResponse = { access_token: "fake-jwt-token" };

    it("should successfully log in a user and return an access token", async () => {
      // Use o tipo 'Mock' importado para o cast
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as unknown as Response);

      const result = await loginUser(mockCredentials);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockCredentials),
      });
      expect(result).toEqual(mockLoginResponse);
    });

    it("should throw an error if login fails (response not ok)", async () => {
      const errorMessage = "Invalid credentials";
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: errorMessage }),
      } as unknown as Response);

      await expect(loginUser(mockCredentials)).rejects.toThrow(errorMessage);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw a generic error if response.json() fails for a failed login", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Failed to parse JSON");
        },
      } as unknown as Response);

      await expect(loginUser(mockCredentials)).rejects.toThrow("Erro ao fazer login"); // LINHA CORRIGIDA
    });
  });

  // Novos Testes para registerUser
  describe("registerUser", () => {
    const mockUserData: CreateUserDto = { username: "newuser", password: "newpassword123" };
    // A resposta do backend para register é um UserProfile
    const mockRegisterResponse: UserProfile = {
      id: "user-uuid-registered",
      username: "newuser",
      // Se UserProfile no frontend espera 'tasks', adicione tasks: []
      // Exemplo, se a interface UserProfile em authService.ts for:
      // export interface UserProfile { id: string; username: string; tasks?: any[]; }
      // Então não precisa de tasks. Se for como a do User (Omit<User, 'password'>) e User tiver tasks, precisa.
      // Vamos assumir que a UserProfile em authService.ts é simples por agora:
      // export interface UserProfile { id: string; username: string; }
      // Se for mais complexa, ajuste o mockRegisterResponse.
    };

    it("should successfully register a user and return user profile", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 201, // Registro bem-sucedido geralmente retorna 201 Created
        json: async () => mockRegisterResponse,
      } as unknown as Response);

      const result = await registerUser(mockUserData);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3000/auth/register", // Endpoint de registro
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mockUserData),
        }
      );
      expect(result).toEqual(mockRegisterResponse);
    });

    it("should throw an error if registration fails (e.g., username already exists)", async () => {
      const errorMessage = "Username already exists";
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 409, // Conflict, comum para usuário já existente
        json: async () => ({ message: errorMessage }),
      } as unknown as Response);

      await expect(registerUser(mockUserData)).rejects.toThrow(errorMessage);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should throw a specific error if response.json() fails for a failed registration", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Failed to parse JSON on register");
        },
      } as unknown as Response);

      // A lógica em registerUser para este caso é:
      // const errorData = await response.json().catch(() => ({ message: 'Erro ao registrar' }));
      // throw new Error(message || `Erro HTTP: ${response.status}`);
      await expect(registerUser(mockUserData)).rejects.toThrow("Erro ao registrar");
    });
  });
});
