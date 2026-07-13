import {IsString, IsInt, IsOptional, Min, IsBoolean} from 'class-validator';

export class CreateMenuItemDto {
    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(1)
    priceRs!: number;

    @IsString()
    category!: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}