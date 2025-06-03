import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import * as authService from "../services/authService";

vi.mock("../services/authService", () => ({
  loginUser: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
