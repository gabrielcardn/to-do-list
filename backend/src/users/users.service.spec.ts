// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository, ObjectLiteral } from 'typeorm'; // ObjectLiteral importado
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Tipo MockRepository corrigido
type MockRepository<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>; // Tipado como MockRepository<User>

  // Função helper para criar o mock específico para User
  const createMockUserRepository = (): MockRepository<User> => ({
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: createMockUserRepository(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
    
    (bcrypt.hash as jest.Mock).mockClear();
    // Limpar mocks de userRepository antes de cada teste 'it' para evitar interferência
    // As funções de mock são garantidas como existentes pela createMockUserRepository
    userRepository.findOneBy!.mockReset();
    userRepository.create!.mockReset();
    userRepository.save!.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto = { username: 'testuser', password: 'password123' };
    const hashedPassword = 'hashedPassword123';
    // Simula a entidade que repository.create retornaria (sem ID ainda, ou com ID se o create fizesse isso)
    // e que seria passada para save.
    const userEntityToSave = { 
      username: createUserDto.username,
      password: hashedPassword,
    };
    // Simula a entidade retornada por repository.save (com ID)
    const savedUserEntity = {
      id: 'some-uuid',
      username: createUserDto.username,
      password: hashedPassword,
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
    });

    it('should create and return a user profile if username does not exist', async () => {
      userRepository.findOneBy!.mockResolvedValue(null); // Usuário não existe
      // userRepository.create é síncrono e retorna o objeto que será salvo
      userRepository.create!.mockReturnValue(userEntityToSave); 
      userRepository.save!.mockResolvedValue(savedUserEntity); // save é assíncrono

      const result = await service.create(createUserDto);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username: createUserDto.username });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: createUserDto.username,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(userEntityToSave);
      expect(result).toEqual({ // O serviço retorna UserProfile (sem a senha)
        id: savedUserEntity.id,
        username: savedUserEntity.username,
      });
    });

    it('should throw a ConflictException if username already exists', async () => {
      userRepository.findOneBy!.mockResolvedValue(savedUserEntity); // Usuário já existe

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createUserDto)).rejects.toThrow('Username already exists');

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled(); // create não deve ser chamado se o usuário já existe
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOneByUsername', () => {
    const username = 'testuser';
    const mockUser = { id: 'some-uuid', username, password: 'hashedPassword' };

    it('should return a user if found', async () => {
      userRepository.findOneBy!.mockResolvedValue(mockUser);
      const result = await service.findOneByUsername(username);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOneBy!.mockResolvedValue(null);
      const result = await service.findOneByUsername(username);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    const userId = 'some-uuid';
    const mockUser = { id: userId, username: 'testuser', password: 'hashedPassword' };
    
    it('should return a user if found by id', async () => {
        userRepository.findOneBy!.mockResolvedValue(mockUser);
        const result = await service.findOneById(userId);
        expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by id', async () => {
        userRepository.findOneBy!.mockResolvedValue(null);
        const result = await service.findOneById(userId); // Corrigido para findOneById
        expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
        expect(result).toBeNull();
    });
  });
});