// src/auth/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '../../users/users.service'; // Ajuste o caminho se necessário

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserProfile => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserProfile; // request.user é populado pela JwtStrategy
  },
);