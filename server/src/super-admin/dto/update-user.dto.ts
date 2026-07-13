import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;
}