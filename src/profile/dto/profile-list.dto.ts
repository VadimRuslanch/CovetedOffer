import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUsersQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50, example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @ApiPropertyOptional({
    example: 'deme',
    minLength: 3,
    maxLength: 20,
    description: 'Подстрока логина, поиск без учёта регистра',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  login?: string;
}
