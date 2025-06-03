// src/pages/LoginPage.test.tsx
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event"; // Para interações de usuário mais realistas
import { BrowserRouter } from "react-router-dom"; // Necessário porque LoginPage usa useNavigate
import LoginPage from "./LoginPage";
import * as authService from "../services/authService"; // Mockar o módulo de serviço

// Mock para o módulo de authService
vi.mock("../services/authService", () => ({
  loginUser: vi.fn(),
  // Adicione outros mocks de funções do authService se LoginPage os usar
}));

// Mock para useNavigate (o LoginPage usa)
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual, // Mantém outras exportações de react-router-dom
    useNavigate: () => mockNavigate, // Sobrescreve useNavigate com nosso mock
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    vi.clearAllMocks(); // Limpa todos os mocks do Vitest, incluindo o de useNavigate e authService
    localStorage.clear(); // Limpa o localStorage para garantir isolamento
  });

  it("should render login form correctly", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("should allow typing into username and password fields", async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByLabelText(/usuário/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/senha/i) as HTMLInputElement;

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "password123");

    expect(usernameInput.value).toBe("testuser");
    expect(passwordInput.value).toBe("password123");
  });

  it("should call loginUser, save token, and navigate on successful login", async () => {
    const user = userEvent.setup();
    const mockLoginResponse = { access_token: "fake-token-123" };
    (authService.loginUser as Mock).mockResolvedValue(mockLoginResponse);

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/usuário/i), "gooduser");
    await user.type(screen.getByLabelText(/senha/i), "goodpassword");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    // Espera que loginUser seja chamado e o restante da lógica assíncrona termine
    await waitFor(() => {
      expect(authService.loginUser).toHaveBeenCalledTimes(1);
      expect(authService.loginUser).toHaveBeenCalledWith({
        username: "gooduser",
        password: "goodpassword",
      });
    });

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBe(mockLoginResponse.access_token);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/main");
    });
  });

  it("should display an error message on failed login", async () => {
    const user = userEvent.setup();
    const errorMessage = "Usuário ou senha inválidos.";
    (authService.loginUser as Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/usuário/i), "baduser");
    await user.type(screen.getByLabelText(/senha/i), "badpassword");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    // Espera que a mensagem de erro apareça no documento
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
