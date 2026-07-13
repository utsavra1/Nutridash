import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  name!: string;

  @IsString()
  cuisine!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  adminEmail!: string;

  @IsString()
  adminPassword!: string;

  @IsString()
  adminName!: string;
}