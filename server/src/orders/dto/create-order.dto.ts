import { IsString, IsArray, ValidateNested, IsInt, Min, IsOptional, ArrayMinSize, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  deliveryAddress!: string;

  @IsOptional()
  @IsString()
  paymentIntentId?: string;
}
