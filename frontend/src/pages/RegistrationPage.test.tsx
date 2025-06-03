// src/pages/RegistrationPage.test.tsx
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom"; // MemoryRouter para testar navegação
import RegistrationPage from "./RegistrationPage";
import * as authService from "../services/authService";
import LoginPage from "./LoginPage";

// Mock para o módulo de authService
vi.mock("../services/authService", () => ({
  registerUser: vi.fn(),
  // Adicione outros mocks de funções do authService se RegistrationPage os usar
}));

// Mock para useNavigate (embora o teste de redirecionamento abaixo use MemoryRouter)
// Se RegistrationPage usar useNavigate diretamente para algo além do redirecionamento pós-submit,
// você pode mocká-lo como fizemos para LoginPage.
// Por agora, focaremos no resultado da navegação com MemoryRouter.
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("RegistrationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement, { route = "/register" } = {}) => {
    window.history.pushState({}, "Test page", route);
    return render(ui, { wrapper: BrowserRouter });
  };

  it("should render registration form correctly", () => {
    renderWithRouter(<RegistrationPage />);

    expect(screen.getByRole("heading", { name: /registrar nova conta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha/i)).toBeInTheDocument(); // Correspondência exata para "Senha"
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /faça login/i })).toBeInTheDocument();
  });

  it("should allow typing into input fields", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    const usernameInput = screen.getByLabelText(/usuário/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^senha/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i) as HTMLInputElement;

    await user.type(usernameInput, "newuser");
    await user.type(passwordInput, "password123");
    await user.type(confirmPasswordInput, "password123");

    expect(usernameInput.value).toBe("newuser");
    expect(passwordInput.value).toBe("password123");
    expect(confirmPasswordInput.value).toBe("password123");
  });

  it("should display an error message if passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegistrationPage />);

    await user.type(screen.getByLabelText(/usuário/i), "testuser");
    await user.type(screen.getByLabelText(/^senha/i), "password123");
    await user.type(screen.getByLabelText(/confirmar senha/i), "password456");
    await user.click(screen.getByRole("button", { name: /registrar/i }));

    expect(screen.getByText(/as senhas não coincidem!/i)).toBeInTheDocument();
    expect(authService.registerUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should call registerUser and attempt to navigate to /login on successful registration", async () => {
    const user = userEvent.setup();
    const mockRegisteredUser = { id: "user-123", username: "newuser" }; // Adapte se UserProfile espera 'tasks'
    (authService.registerUser as Mock).mockResolvedValue(mockRegisteredUser);

    // Para este teste, BrowserRouter é suficiente se estamos apenas verificando a chamada do mockNavigate.
    // MemoryRouter é mais útil se você não mockar useNavigate e quiser ver a mudança real de componente.
    render(
      <BrowserRouter>
        <RegistrationPage />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/usuário/i), "newuser");
    await user.type(screen.getByLabelText(/^senha/i), "newpassword123");
    await user.type(screen.getByLabelText(/confirmar senha/i), "newpassword123");

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    await user.click(screen.getByRole("button", { name: /registrar/i }));

    await waitFor(() => {
      expect(authService.registerUser).toHaveBeenCalledTimes(1);
      expect(authService.registerUser).toHaveBeenCalledWith({
        username: "newuser",
        password: "newpassword123",
      });
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Registro bem-sucedido! Você pode fazer login agora.");
    });

    // VERIFIQUE SE O MOCKNAVIGATE FOI CHAMADO:
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    alertSpy.mockRestore();
  });
  it("should display an error message on failed registration (e.g., username exists)", async () => {
    const user = userEvent.setup();
    const errorMessage = "Nome de usuário já existe";
    (authService.registerUser as Mock).mockRejectedValue(new Error(errorMessage));

    renderWithRouter(<RegistrationPage />);

    await user.type(screen.getByLabelText(/usuário/i), "existinguser");
    await user.type(screen.getByLabelText(/^senha/i), "password123");
    await user.type(screen.getByLabelText(/confirmar senha/i), "password123");
    await user.click(screen.getByRole("button", { name: /registrar/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled(); // Não deve navegar se o registro falhar
  });

  it('should render LoginPage when navigating to /login', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Adicione outras rotas que App.tsx define, se necessário para o contexto */}
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
});
});
