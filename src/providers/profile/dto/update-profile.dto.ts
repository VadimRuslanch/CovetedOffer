import { OmitType, PartialType } from '@nestjs/swagger';
import { RegisterDto } from '../../auth/dto/register.dto.js';

export class UpdateProfileDto extends PartialType(
  OmitType(RegisterDto, ['password'] as const),
  { skipNullProperties: false },
) {}
