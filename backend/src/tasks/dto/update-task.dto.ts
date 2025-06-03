import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskStatus } from '../task.entity';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1, {
    message: 'O título não pode ser uma string vazia se fornecido.',
  })
  @MaxLength(255, { message: 'O título pode ter no máximo 255 caracteres.' })
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'Status inválido. Use PENDING, IN_PROGRESS ou DONE.',
  })
  status?: TaskStatus;
}
