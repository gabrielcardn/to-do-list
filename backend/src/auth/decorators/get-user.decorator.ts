import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '../../users/users.service'; 

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserProfile => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserProfile; 
  },
);