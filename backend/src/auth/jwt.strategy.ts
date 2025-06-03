// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service'; // Para buscar o usuário
import { UserProfile } from '../users/users.service'; // Usaremos UserProfile

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrai o token do cabeçalho Authorization: Bearer <token>
      ignoreExpiration: false, // Garante que tokens expirados sejam rejeitados
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do token JWT.
   * Este método é chamado pelo Passport após o token ser decodificado e verificado com sucesso.
   * O que este método retorna será injetado no objeto `request.user` das rotas protegidas.
   */
  async validate(payload: { sub: string; username: string }): Promise<UserProfile> {
    // 'sub' (subject) é o ID do usuário que colocamos no payload do JWT ao fazer login
    // 'username' é o nome de usuário que também colocamos no payload
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or invalid token.');
    }
    // Remove a senha antes de retornar o objeto do usuário
    const { password, ...result } = user;
    return result as UserProfile;
  }
}