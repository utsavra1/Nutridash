import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(data: any) {
    return this.prisma.order.create({
      data,
      include: {
        orderItems: true,
        restaurant: true,
      },
    });
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: true,
          restaurant: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getOrderById(orderId: string, userId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItems: { include: { menuItem: { include: { nutrition: true } } } },
        restaurant: true,
      },
    });
  }

  async cancelOrder(orderId: string, userId: string) {
    return this.prisma.order.updateMany({
      where: { id: orderId, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
  }

  async getMenuItemById(menuItemId: string) {
    return this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { nutrition: true },
    });
  }

  async getHealthProfile(userId: string) {
    return this.prisma.healthProfile.findUnique({
      where: { userId },
    });
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
  }
}