// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate,Link  } from 'react-router-dom'; // Importe useNavigate
import { loginUser, type LoginCredentials, type LoginResponse } from '../services/authService';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegação

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const credentials: LoginCredentials = { username, password };

    try {
      const data: LoginResponse = await loginUser(credentials);
      console.log('Login bem-sucedido!', data);

      // 1. Armazenar o token
      localStorage.setItem('accessToken', data.access_token);

      // 2. Redirecionar para a página principal
      navigate('/main');

    } catch (err: any) {
      console.error('Falha no login:', err);
      setError(err.message || 'Usuário ou senha inválidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {/* ... campos do formulário (username, password) e botão ... (sem alteração) */}
        <div>
          <label htmlFor="username">Usuário:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Não tem uma conta? <Link to="/register">Registre-se aqui</Link> {/* <-- Link adicionado */}
      </p>
    </div>
  );
}

export default LoginPage;