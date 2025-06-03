import { Injectable } from '@nestjs/common';
import { UsersService, UserProfile } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IsString, IsNotEmpty } from 'class-validator';

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
  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserProfile | null> {
    const user = await this.usersService.findOneByUsername(username);

    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result as UserProfile;
    }
    return null;
  }

  /**
   * Gera um token JWT para o usuário.
   * @param user O objeto do usuário (normalmente o resultado de validateUser ou um objeto com id e username).
   * @returns Um objeto com o access_token.
   */
  async login(user: UserProfile) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
