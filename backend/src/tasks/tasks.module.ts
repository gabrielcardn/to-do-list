// src/tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { AuthModule } from '../auth/auth.module'; // Para acesso à configuração do Passport/JWT

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]), // Disponibiliza Repository<Task>
    AuthModule, // Importa o AuthModule para que os guards e estratégias de autenticação estejam disponíveis
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}