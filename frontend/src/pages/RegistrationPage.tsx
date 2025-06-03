// src/pages/RegistrationPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, type CreateUserDto } from '../services/authService'; // Importe as novidades

function RegistrationPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }

    setIsLoading(true);

    const userData: CreateUserDto = { username, password };

    try {
      // Chama a função real de registro da API
      const registeredUser = await registerUser(userData);
      console.log('Registro bem-sucedido!', registeredUser);
      alert('Registro bem-sucedido! Você pode fazer login agora.');
      navigate('/login'); // Redireciona para a página de login após o registro
    } catch (err: any) {
      console.error('Falha no registro:', err);
      // err.message aqui deve vir da throw new Error() no authService
      setError(err.message || 'Não foi possível registrar. Verifique os dados ou tente outro nome de usuário.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Registrar Nova Conta</h2>
      <form onSubmit={handleSubmit}>
        {/* Campos do formulário (username, password, confirmPassword) - sem alteração */}
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
        <div>
          <label htmlFor="confirmPassword">Confirmar Senha:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <p>
        Já tem uma conta? <Link to="/login">Faça login</Link>
      </p>
    </div>
  );
}

export default RegistrationPage;