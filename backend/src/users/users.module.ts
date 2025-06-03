// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service'
import { User } from './user.entity'; // Importe a entidade User
// Se você for criar um UsersController depois, importe-o aqui também
// import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Disponibiliza o repositório User para este módulo
  providers: [UsersService],
  // controllers: [UsersController], // Descomente se/quando criar o controller
  exports: [UsersService], // Exporte o UsersService para que outros módulos (como o AuthModule) possam usá-lo
})
export class UsersModule {}