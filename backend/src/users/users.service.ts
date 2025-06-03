// src/users/users.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// DTO (Data Transfer Object) para criação de usuário
export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome de usuário não pode estar vazio.' })
  @IsString()
  @MinLength(3, { message: 'O nome de usuário deve ter pelo menos 3 caracteres.' })
  username: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  password: string;
}

// Definindo um tipo para o usuário retornado sem a senha
// Omit<User, 'password'> cria um tipo que tem todas as propriedades de User exceto 'password'
export type UserProfile = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserProfile> { // Alterado o tipo de retorno
    const { username, password } = createUserDto;

    const existingUser = await this.usersRepository.findOneBy({ username });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userEntity = this.usersRepository.create({
      username,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(userEntity);

    // Retorna o usuário sem a propriedade password usando desestruturação
    const { password: _, ...userProfile } = savedUser; // _ indica que a variável password não será usada
    return userProfile;
  }

  async findOneByUsername(username: string): Promise<User | null> { // Alterado para User | null
    return this.usersRepository.findOneBy({ username });
  }

  async findOneById(id: string): Promise<User | null> { // Alterado para User | null
    return this.usersRepository.findOneBy({ id });
  }
}