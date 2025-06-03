import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UserProfile } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Valida o payload do token JWT.
   * Este método é chamado pelo Passport após o token ser decodificado e verificado com sucesso.
   * O que este método retorna será injetado no objeto `request.user` das rotas protegidas.
   */
  async validate(payload: {
    sub: string;
    username: string;
  }): Promise<UserProfile> {
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or invalid token.');
    }

    const { password, ...result } = user;
    return result as UserProfile;
  }
}
