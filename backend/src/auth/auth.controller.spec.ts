import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto, UserProfile } from '../users/users.service';
import { LoginDto } from './auth.service';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Task } from '../tasks/task.entity';

const mockAuthService = {
  register: jest.fn(),
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    mockAuthService.register.mockReset();
    mockAuthService.validateUser.mockReset();
    mockAuthService.login.mockReset();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      username: 'testregister',
      password: 'password123',
    };
    const expectedUserProfile: UserProfile = {
      id: 'user-uuid-register',
      username: 'testregister',
      tasks: [],
    };

    it('should call authService.register and return a user profile', async () => {
      mockAuthService.register.mockResolvedValue(expectedUserProfile);

      const result = await controller.register(createUserDto);

      expect(service.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUserProfile);
    });

    it('should propagate errors from authService.register', async () => {
      const error = new Error('Registration failed');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(createUserDto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      username: 'testlogin',
      password: 'password123',
    };
    const userProfile: UserProfile = {
      id: 'user-uuid-login',
      username: 'testlogin',
      tasks: [],
    };
    const loginResponse = { access_token: 'mockAccessToken' };

    it('should call authService.validateUser and authService.login, then return an access token for valid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(userProfile);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(service.login).toHaveBeenCalledWith(userProfile);
      expect(result).toEqual(loginResponse);
    });

    it('should throw UnauthorizedException if authService.validateUser returns null (invalid credentials)', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(service.login).not.toHaveBeenCalled();
    });

    it('should propagate errors from authService.validateUser', async () => {
      const error = new Error('Validation failed');
      mockAuthService.validateUser.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
      expect(service.login).not.toHaveBeenCalled();
    });

    it('should propagate errors from authService.login if validateUser succeeded', async () => {
      mockAuthService.validateUser.mockResolvedValue(userProfile);
      const error = new Error('JWT signing failed');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });
});
