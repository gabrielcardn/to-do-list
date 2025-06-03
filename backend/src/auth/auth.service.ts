// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService, UserProfile } from '../users/users.service'; // Mantemos UserProfile aqui
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity'; // Precisamos da entidade User para o tipo completo do usuário com senha
import { IsString, IsNotEmpty } from 'class-validator'; // Importe os decoradores

// DTO para o payload do login
export class LoginDto {
  @IsNotEmpty({ message: 'O nome de usuário não pode estar vazio.' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @IsString()
  password: string;
}


@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: any): Promise<UserProfile> {
    try {
      const user = await this.usersService.create(createUserDto);
      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Valida as credenciais do usuário.
   * @param username O nome de usuário.
   * @param pass A senha fornecida.
   * @returns O objeto do usuário (sem a senha) se as credenciais forem válidas, caso contrário null.
   */
  async validateUser(username: string, pass: string): Promise<UserProfile | null> {
    const user = await this.usersService.findOneByUsername(username);
    // user aqui pode ser User | null. Se for User, ele tem a senha criptografada.
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // Se bcrypt.compare for true, a senha é válida.
      // Retornamos o usuário sem a senha.
      const { password, ...result } = user;
      return result as UserProfile; // Cast para UserProfile para garantir que a senha não está incluída no tipo
    }
    return null;
  }

  /**
   * Gera um token JWT para o usuário.
   * @param user O objeto do usuário (normalmente o resultado de validateUser ou um objeto com id e username).
   * @returns Um objeto com o access_token.
   */
  async login(user: UserProfile) { // user aqui já não tem a senha
    const payload = { username: user.username, sub: user.id }; // 'sub' é uma convenção para o ID do sujeito (usuário)
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}