// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, UserProfile } from '../users/users.service'; // DTO e tipo de UserProfile
import { LoginDto } from './auth.service'; // DTO de Login
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Task } from '../tasks/task.entity'; // Importe Task para UserProfile

// Mock para AuthService
const mockAuthService = {
  register: jest.fn(),
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService; // Para ter acesso aos mocks do serviço

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService, // Fornece o mock do AuthService
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    // Resetar mocks antes de cada teste
    mockAuthService.register.mockReset();
    mockAuthService.validateUser.mockReset();
    mockAuthService.login.mockReset();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Testes para o endpoint register (POST /auth/register)
  describe('register', () => {
    const createUserDto: CreateUserDto = { username: 'testregister', password: 'password123' };
    // UserProfile agora espera tasks: Task[] por causa do Omit<User, 'password'>
    const expectedUserProfile: UserProfile = { 
      id: 'user-uuid-register', 
      username: 'testregister',
      tasks: [] // Adicionado para conformidade com UserProfile
    };

    it('should call authService.register and return a user profile', async () => {
      mockAuthService.register.mockResolvedValue(expectedUserProfile);

      // Simular o @HttpCode(HttpStatus.CREATED) não é direto no teste unitário do controller,
      // mas podemos verificar se o método do serviço é chamado e retorna o valor correto.
      // A verificação do status code exato é melhor em testes e2e.
      const result = await controller.register(createUserDto);

      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUserProfile);
    });

    it('should propagate errors from authService.register', async () => {
      const error = new Error("Registration failed");
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(createUserDto)).rejects.toThrow(error);
    });
  });

  // Testes para o endpoint login (POST /auth/login)
  describe('login', () => {
    const loginDto: LoginDto = { username: 'testlogin', password: 'password123' };
    const userProfile: UserProfile = { 
      id: 'user-uuid-login', 
      username: 'testlogin',
      tasks: [] // Adicionado para conformidade com UserProfile
    };
    const loginResponse = { access_token: 'mockAccessToken' };

    it('should call authService.validateUser and authService.login, then return an access token for valid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(userProfile);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(loginDto.username, loginDto.password);
      expect(service.login).toHaveBeenCalledWith(userProfile);
      expect(result).toEqual(loginResponse);
    });

    it('should throw UnauthorizedException if authService.validateUser returns null (invalid credentials)', async () => {
      mockAuthService.validateUser.mockResolvedValue(null); // Simula credenciais inválidas

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');

      // Garante que authService.login não foi chamado se a validação falhou
      expect(service.login).not.toHaveBeenCalled();
    });

    it('should propagate errors from authService.validateUser', async () => {
      const error = new Error("Validation failed");
      mockAuthService.validateUser.mockRejectedValue(error);
      
      await expect(controller.login(loginDto)).rejects.toThrow(error);
      expect(service.login).not.toHaveBeenCalled();
    });
    
    it('should propagate errors from authService.login if validateUser succeeded', async () => {
      mockAuthService.validateUser.mockResolvedValue(userProfile);
      const error = new Error("JWT signing failed");
      mockAuthService.login.mockRejectedValue(error);
      
      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });
});