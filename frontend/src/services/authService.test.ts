import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import {
  loginUser,
  registerUser,
  type LoginCredentials,
  type LoginResponse,
  type CreateUserDto,
  type UserProfile,
} from "./authService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

describe("authService", () => {
  beforeEach(() => {
    const fetchMockFunc = vi.fn();
    vi.stubGlobal("fetch", fetchMockFunc);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("loginUser", () => {
    const mockCredentials: LoginCredentials = { username: "test", password: "password" };
    const mockLoginResponse: LoginResponse = { access_token: "fake-jwt-token" };

    it("should successfully log in a user and return an access token", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockLoginResponse,
      } as unknown as Response);

      const result = await loginUser(mockCredentials);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/auth/login", {
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

      await expect(loginUser(mockCredentials)).rejects.toThrow("Erro ao fazer login");
    });
  });

  describe("registerUser", () => {
    const mockUserData: CreateUserDto = { username: "newuser", password: "newpassword123" };

    const mockRegisterResponse: UserProfile = {
      id: "user-uuid-registered",
      username: "newuser",
    };

    it("should successfully register a user and return user profile", async () => {
      (fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockRegisterResponse,
      } as unknown as Response);

      const result = await registerUser(mockUserData);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockUserData),
      });
      expect(result).toEqual(mockRegisterResponse);
    });

    it("should throw an error if registration fails (e.g., username already exists)", async () => {
      const errorMessage = "Username already exists";
      (fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
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

      await expect(registerUser(mockUserData)).rejects.toThrow("Erro ao registrar");
    });
  });
});
