import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NutritionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getNutritionInfo(menuItemId: string) {
    return this.prisma.nutritionInfo.findUnique({
      where: { menuItemId },
    });
  }

  async getHealthProfile(userId: string) {
    return this.prisma.healthProfile.findUnique({
      where: { userId },
    });
  }

  async getRestaurantMenuItems(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      include: { nutrition: true },
    });
  }

  async getMenuItemById(menuItemId: string) {
    return this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { nutrition: true },
    });
  }

  async getNutritionLogs(userId: string, since: Date) {
    return this.prisma.nutritionLog.findMany({
      where: {
        userId,
        logDate: { gte: since },
      },
      orderBy: { logDate: 'asc' },
    });
  }
}
