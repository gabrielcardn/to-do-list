// src/tasks/tasks.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UserProfile } from '../users/users.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  // src/tasks/tasks.service.ts
  async createTask(
    createTaskDto: CreateTaskDto,
    user: UserProfile,
  ): Promise<Task> {
    const { title, description, status } = createTaskDto;
    const taskEntity = this.tasksRepository.create({
      // Renomeado para clareza
      title,
      description,
      status: status || TaskStatus.PENDING,
      userId: user.id,
    });
    // RETORNE O RESULTADO DO SAVE:
    return this.tasksRepository.save(taskEntity);
  }
  async getTasks(
    user: UserProfile,
    paginationQueryDto: PaginationQueryDto,
  ): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [tasks, total] = await this.tasksRepository.findAndCount({
      where: { userId: user.id }, // Filtra tarefas pelo ID do usuário logado
      order: { status: 'ASC', title: 'ASC' }, // Exemplo de ordenação
      skip: skip,
      take: limit,
    });

    return {
      data: tasks,
      total,
      page: Number(page), // Garante que page e limit sejam números na resposta
      limit: Number(limit),
    };
  }

  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    user: UserProfile,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user); // Esta chamada é mockada no teste
    task.status = updateTaskStatusDto.status;
    return this.tasksRepository.save(task); // Retorne o resultado do save
  }
  // Poderíamos adicionar um getTaskById também, se necessário
  async getTaskById(id: string, user: UserProfile): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, userId: user.id }); // Busca por id E userId
    if (!task) {
      throw new NotFoundException(
        `Tarefa com ID "${id}" não encontrada ou não pertence a você.`,
      );
    }
    return task;
  }

  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    user: UserProfile,
  ): Promise<Task> {
    // Reutiliza getTaskById para buscar e verificar propriedade da tarefa
    const task = await this.getTaskById(id, user);

    // Atualiza os campos da tarefa apenas se eles foram fornecidos no DTO
    if (updateTaskDto.title !== undefined) {
      task.title = updateTaskDto.title;
    }
    if (updateTaskDto.description !== undefined) {
      task.description = updateTaskDto.description;
    }
    if (updateTaskDto.status !== undefined) {
      task.status = updateTaskDto.status;
    }

    await this.tasksRepository.save(task);
    return task;
  }

  // Novo método para deletar uma tarefa
  async deleteTask(id: string, user: UserProfile): Promise<void> {
    // Primeiro, verifica se a tarefa existe e pertence ao usuário.
    // O método getTaskById já faz essa verificação e lança NotFoundException se não encontrar.
    await this.getTaskById(id, user);

    // Se a tarefa existe e pertence ao usuário, então podemos deletá-la.
    // O método delete do TypeORM remove a entidade pelo ID.
    // Ele retorna um objeto DeleteResult que contém informações sobre a operação (ex: affected rows).
    const result: DeleteResult = await this.tasksRepository.delete({
      id,
      userId: user.id,
    });

    // Verificamos se alguma linha foi realmente afetada (deletada).
    // Embora getTaskById já verifique, esta é uma camada extra de segurança ou para casos onde
    // a tarefa poderia ser deletada por outro processo entre a verificação e a deleção (raro aqui).
    if (result.affected === 0) {
      // Isso não deveria acontecer se getTaskById passou, mas é uma boa prática.
      throw new NotFoundException(
        `Tarefa com ID "${id}" não encontrada para deleção.`,
      );
    }
    // Não há necessidade de retornar nada em uma operação de delete bem-sucedida (void).
  }
}
