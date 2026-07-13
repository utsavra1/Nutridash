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
}