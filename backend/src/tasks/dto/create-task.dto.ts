// src/tasks/dto/create-task.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'O título não pode estar vazio.' })
  @IsString()
  @MaxLength(255, { message: 'O título pode ter no máximo 255 caracteres.'})
  title: string;

  @IsOptional()
  @IsString()
  description?: string; // Descrição é opcional

  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Status inválido.' })
  status?: TaskStatus; // Status é opcional na criação, usará o default da entidade
}