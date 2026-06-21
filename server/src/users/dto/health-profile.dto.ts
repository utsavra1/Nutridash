import { IsInt, IsNumber, IsEnum, IsArray, IsString, Min, Max, IsOptional } from 'class-validator';

export enum HealthGoalDto {
  LOSE = 'LOSE',
  MAINTAIN = 'MAINTAIN',
  GAIN = 'GAIN',
}

export enum DietaryRestrictionDto {
  NONE = 'NONE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
}

export class CreateHealthProfileDto {
  @IsInt()
  @Min(13)
  @Max(120)
  age!: number;

  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg!: number;

  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm!: number;

  @IsEnum(HealthGoalDto)
  goal!: HealthGoalDto;

  @IsEnum(DietaryRestrictionDto)
  dietaryRestriction!: DietaryRestrictionDto;

  @IsArray()
  @IsString({ each: true })
  allergens!: string[];

  @IsInt()
  @Min(800)
  @Max(6000)
  calorieTarget!: number;
}

export class UpdateHealthProfileDto {
  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsEnum(HealthGoalDto)
  goal?: HealthGoalDto;

  @IsOptional()
  @IsEnum(DietaryRestrictionDto)
  dietaryRestriction?: DietaryRestrictionDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergens?: string[];

  @IsOptional()
  @IsInt()
  @Min(800)
  @Max(6000)
  calorieTarget?: number;
}