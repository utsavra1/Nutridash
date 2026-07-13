import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MenuItem, Restaurant, Prisma } from '@prisma/client';

@Injectable()
export class RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(cuisine?: string): Promise<Restaurant[]> {
    const where: Prisma.RestaurantWhereInput = { isActive: true };
    if (cuisine) {
      where.cuisine = cuisine;
    }

    return this.prisma.restaurant.findMany({ where });
  }

  async findOneById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({ where: { id } });
  }

  async findMenuByRestaurantId(
    restaurantId: string,
  ): Promise<(MenuItem & { nutrition?: any })[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      include: { nutrition: true },
    });
  }
}
