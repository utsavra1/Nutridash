import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
    constructor(private readonly prisma: PrismaService){}

    async createMenuItem(data: any) {
    return this.prisma.menuItem.create({
      data,
      include: { nutrition: true },
    });
  }

  async updateMenuItem(id: string, data: any, restaurantId: string) {
    return this.prisma.menuItem.updateMany({
      where: { id, restaurantId },
      data,
    });
  }

  async deleteMenuItem(id: string, restaurantId: string) {
    return this.prisma.menuItem.deleteMany({
      where: { id, restaurantId },
    });
  }

  async getMenuItems(restaurantId: string) {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: { nutrition: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMenuItemById(id: string, restaurantId: string) {
    return this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: { nutrition: true },
    });
  }

  async updateNutritionStatus(menuItemId: string, status: 'PENDING' | 'FETCHED' | 'FAILED') {
    return this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: { nutritionStatus: status },
    });
  }

  async upsertNutritionInfo(data: any) {
    return this.prisma.nutritionInfo.upsert({
      where: { menuItemId: data.menuItemId },
      update: data,
      create: data,
    });
  }

  async getDashboardStats(restaurantId: string) {
    const [totalMenuItems, todayOrders, avgCalories] = await Promise.all([
      // Total menu items count
      this.prisma.menuItem.count({
        where: { restaurantId, isAvailable: true },
      }),
      // Orders today count
      this.prisma.order.count({
        where: {
          restaurantId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Average calories (as a proxy for health - lower is generally healthier)
      this.prisma.nutritionInfo.aggregate({
        where: {
          menuItem: { restaurantId },
        },
        _avg: {
          calories: true,
        },
      }),
    ]);

    // Calculate a simple health score based on average calories
    // Lower calories = higher score (capped at 100)
    const avgHealthScore = avgCalories._avg.calories
      ? Math.max(0, Math.min(100, 100 - Math.floor((avgCalories._avg.calories - 200) / 10)))
      : 0;

    return {
      totalMenuItems,
      todayOrders,
      avgHealthScore,
    };
  }
}