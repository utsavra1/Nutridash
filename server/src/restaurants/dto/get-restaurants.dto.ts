import { IsOptional, IsString } from 'class-validator';

export class GetRestaurantsDto {
  @IsOptional()
  @IsString()
  cuisine?: string;
}
