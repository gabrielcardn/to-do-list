// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service'; // Importe LoginDto
import { CreateUserDto, UserProfile } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto): Promise<UserProfile> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Define o código de status HTTP para 200 OK
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Se validateUser retornou um usuário, então as credenciais são válidas.
    // Agora, geramos o token JWT.
    return this.authService.login(user); // user aqui é UserProfile (sem a senha)
  }
}