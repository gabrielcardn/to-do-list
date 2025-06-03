// src/tasks/dto/pagination-query.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // Transforma o parâmetro da query string (que é string) em número
  @IsInt()
  @Min(1)
  page?: number = 1; // Página padrão é 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Limite máximo de itens por página
  limit?: number = 10; // Limite padrão de 10 itens por página
}