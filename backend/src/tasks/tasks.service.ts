import { Injectable, NotFoundException } from '@nestjs/common';
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

  async createTask(
    createTaskDto: CreateTaskDto,
    user: UserProfile,
  ): Promise<Task> {
    const { title, description, status } = createTaskDto;
    const taskEntity = this.tasksRepository.create({
      title,
      description,
      status: status || TaskStatus.PENDING,
      userId: user.id,
    });

    return this.tasksRepository.save(taskEntity);
  }
  async getTasks(
    user: UserProfile,
    paginationQueryDto: PaginationQueryDto,
  ): Promise<{ data: Task[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationQueryDto;
    const skip = (page - 1) * limit;

    const [tasks, total] = await this.tasksRepository.findAndCount({
      where: { userId: user.id },
      order: { status: 'ASC', title: 'ASC' },
      skip: skip,
      take: limit,
    });

    return {
      data: tasks,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
    user: UserProfile,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = updateTaskStatusDto.status;
    return this.tasksRepository.save(task);
  }

  async getTaskById(id: string, user: UserProfile): Promise<Task> {
    const task = await this.tasksRepository.findOneBy({ id, userId: user.id });
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
    const task = await this.getTaskById(id, user);

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

  async deleteTask(id: string, user: UserProfile): Promise<void> {
    await this.getTaskById(id, user);

    const result: DeleteResult = await this.tasksRepository.delete({
      id,
      userId: user.id,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Tarefa com ID "${id}" não encontrada para deleção.`,
      );
    }
  }
}
