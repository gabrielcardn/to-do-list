// src/tasks/dto/update-task-status.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../task.entity'; // Importa o enum TaskStatus

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'O status não pode estar vazio.'})
  @IsEnum(TaskStatus, { message: 'Status inválido. Use PENDING, IN_PROGRESS ou DONE.' })
  status: TaskStatus;
}