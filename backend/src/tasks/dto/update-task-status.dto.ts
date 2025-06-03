import { IsEnum, IsNotEmpty } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'O status não pode estar vazio.' })
  @IsEnum(TaskStatus, {
    message: 'Status inválido. Use PENDING, IN_PROGRESS ou DONE.',
  })
  status: TaskStatus;
}
