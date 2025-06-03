// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService, UserProfile, CreateUserDto } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity'; // Importe Task se for usar no tipo tasks: Task[]

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService; // Mocked instance
  let jwtService: JwtService;     // Mocked instance

  const mockUsersService = {
    create: jest.fn(),
    findOneByUsername: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    mockUsersService.create.mockReset();
    mockUsersService.findOneByUsername.mockReset();
    mockJwtService.sign.mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = { username: 'newuser', password: 'password123' };
    // CORRIGIDO: Adicionado tasks: []
    const userProfile: UserProfile = { id: 'uuid-newUser', username: 'newuser', tasks: [] };

    it('should call usersService.create and return a user profile', async () => {
      mockUsersService.create.mockResolvedValue(userProfile);

      const result = await authService.register(createUserDto);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(userProfile);
    });

    it('should re-throw errors from usersService.create', async () => {
      const error = new Error('Failed to create');
      mockUsersService.create.mockRejectedValue(error);
      await expect(authService.register(createUserDto)).rejects.toThrow(error);
    });
  });

  describe('validateUser', () => {
    const username = 'testuser';
    const password = 'password123';
    const mockUser: User = {
      id: 'uuid-testuser',
      username,
      password: 'hashedPassword',
      tasks: [], // Adicionado tasks: [] aqui também
    };
    // CORRIGIDO: Adicionado tasks: []
    const expectedUserProfile: UserProfile = { id: mockUser.id, username: mockUser.username, tasks: [] };

    it('should return user profile if credentials are valid', async () => {
      mockUsersService.findOneByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(username, password);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toEqual(expectedUserProfile);
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      const result = await authService.validateUser(username, password);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      mockUsersService.findOneByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await authService.validateUser(username, password);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    // CORRIGIDO: Adicionado tasks: []
    const userProfileInput: UserProfile = { id: 'uuid-testuser', username: 'testuser', tasks: [] };
    const accessToken = 'mockAccessToken';

    it('should return an access token for a valid user profile', async () => {
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await authService.login(userProfileInput); // Passa o UserProfile completo
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: userProfileInput.username,
        sub: userProfileInput.id,
      });
      expect(result).toEqual({ access_token: accessToken });
    });
  });
});