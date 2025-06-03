// src/tasks/tasks.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req, // Para acessar o objeto request
  Param, // <-- Importe Param
  Patch, // <-- Importe Patch
  ParseUUIDPipe, // <-- Para validar se o ID é um UUID (opcional, mas bom)
  Delete, // <-- Importe Delete
  HttpCode, // <-- Importe HttpCode
  HttpStatus, // <-- Importe HttpStatus
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AuthGuard } from '@nestjs/passport'; // Importa o AuthGuard
import { UserProfile } from '../users/users.service'; // Para tipar req.user
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Task } from './task.entity';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto'; // <-- Importe o DTO
import { UpdateTaskDto } from './dto/update-task.dto'; // <-- Importe o DTO

// Decorador customizado para pegar o usuário do request (opcional, mas elegante)
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('tasks')
@UseGuards(AuthGuard('jwt')) // Protege todos os endpoints neste controller com JWT
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(
    @Query() paginationQueryDto: PaginationQueryDto,
    @GetUser() user: UserProfile,
  ): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    return this.tasksService.getTasks(user, paginationQueryDto);
  }

  // Endpoint para buscar uma tarefa específica (usando o getTaskById do serviço)
  @Get('/:id')
  async getTaskById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserProfile,
  ): Promise<Task> {
    return this.tasksService.getTaskById(id, user);
  }

  @Post()
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: UserProfile, // Usa o decorador customizado GetUser
  ): Promise<Task> {
    // Alternativamente, sem o decorador GetUser:
    // @Req() req: any, // Tipagem mais genérica para req
    // const user = req.user as UserProfile;
    return this.tasksService.createTask(createTaskDto, user);
  }

  // Novo endpoint para atualizar o status da tarefa
  @Patch('/:id/status') // Ex: PATCH /tasks/algum-uuid/status
  async updateTaskStatus(
    @Param('id', ParseUUIDPipe) id: string, // Pega o 'id' da URL e valida se é um UUID
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @GetUser() user: UserProfile,
  ): Promise<Task> {
    return this.tasksService.updateTaskStatus(id, updateTaskStatusDto, user);
  }

  // Novo endpoint para atualizar os detalhes da tarefa
  @Patch('/:id') // Ex: PATCH /tasks/algum-uuid
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string, // Pega o 'id' da URL e valida se é um UUID
    @Body() updateTaskDto: UpdateTaskDto, // Pega o corpo da requisição com os dados a serem atualizados
    @GetUser() user: UserProfile, // Obtém o usuário autenticado
  ): Promise<Task> {
    return this.tasksService.updateTask(id, updateTaskDto, user);
  }

  // Novo endpoint para deletar uma tarefa
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT) // Define o status HTTP para 204 No Content em caso de sucesso
  async deleteTask(
    @Param('id', ParseUUIDPipe) id: string, // Pega o 'id' da URL e valida se é um UUID
    @GetUser() user: UserProfile, // Obtém o usuário autenticado
  ): Promise<void> {
    // O método do controller também não retorna conteúdo
    return this.tasksService.deleteTask(id, user);
  }
}
