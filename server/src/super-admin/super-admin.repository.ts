import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminRepository{
    constructor(private readonly prisma: PrismaService){}

    async createRestaurant(data: any){
        return this.prisma.restaurant.create({
            data,
        })
    }

    async createRestaurantAdmin(data: any){
        return this.prisma.user.create({
            data,
        })
    }

    async getRestaurants() {
        return this.prisma.restaurant.findMany({
        include: { admins: true },
        orderBy: { createdAt: 'desc' },
    });
  }

    async getRestaurantById(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: { admins: true },
    });
  }

  async updateRestaurant(id: string, data: any) {
    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      include: { healthProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { healthProfile: true },
    });
  }

  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: { user: true, restaurant: true, orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersByRestaurant(restaurantId: string) {
    return this.prisma.order.findMany({
      where: { restaurantId },
      include: { user: true, restaurant: true, orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersByStatus(status: string) {
    return this.prisma.order.findMany({
      where: { status: status as any },
      include: { user: true, restaurant: true, orderItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRestaurantByName(name: string) {
    return this.prisma.restaurant.findFirst({
      where: { name },
    });
  }

  async getUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async getDashboardStats() {
    const [totalRestaurants, totalUsers, todayOrders, activeRestaurants] = await Promise.all([
      // Total restaurants
      this.prisma.restaurant.count(),
      // Total users
      this.prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      // Orders today
      this.prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // Active restaurants
      this.prisma.restaurant.count({
        where: { isActive: true },
      }),
    ]);

    return {
      totalRestaurants,
      totalUsers,
      todayOrders,
      activeRestaurants,
    };
  }
 }
