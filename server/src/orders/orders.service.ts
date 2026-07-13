import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateHealthScore } from '../common/utils/nutrition';

@Injectable()
export class OrdersService {
  constructor(private ordersRepo: OrdersRepository) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const restaurantIdSet = new Set<string>();
    const orderItemsData: any[] = [];
    let totalPriceRs = 0;
    let totalCalories = 0;
    let totalProteinG = 0;
    let totalCarbsG = 0;
    let totalFatG = 0;
    let totalFiberG = 0;
    const healthScores: number[] = [];

    const profile = await this.ordersRepo.getHealthProfile(userId);
    if (!profile) {
      throw new BadRequestException('Health profile not found');
    }

    for (const item of dto.items) {
      const menuItem = await this.ordersRepo.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
      }

      restaurantIdSet.add(menuItem.restaurantId);
      totalPriceRs += menuItem.priceRs * item.quantity;

      if (menuItem.nutrition) {
        totalCalories += menuItem.nutrition.calories * item.quantity;
        totalProteinG += menuItem.nutrition.proteinG * item.quantity;
        totalCarbsG += menuItem.nutrition.carbsG * item.quantity;
        totalFatG += menuItem.nutrition.fatG * item.quantity;
        totalFiberG += menuItem.nutrition.fiberG * item.quantity;

        const score = calculateHealthScore(
          {
            calories: menuItem.nutrition.calories,
            proteinG: menuItem.nutrition.proteinG,
            carbsG: menuItem.nutrition.carbsG,
            fatG: menuItem.nutrition.fatG,
            fiberG: menuItem.nutrition.fiberG,
          },
          profile,
        );
        healthScores.push(score);
      }

      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPriceRs: menuItem.priceRs,
      });
    }

    if (restaurantIdSet.size !== 1) {
      throw new BadRequestException('All items must be from the same restaurant');
    }

    const restaurantId = Array.from(restaurantIdSet)[0];
    const healthScoreAvg = healthScores.length > 0 
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) 
      : null;

    // Create ONE order with both orderItems and nutritionLog
    const order = await this.ordersRepo.createOrder({
      userId,
      restaurantId,
      totalPriceRs,
      totalCalories,
      healthScoreAvg,
      deliveryAddress: dto.deliveryAddress,
      orderItems: {
        create: orderItemsData,
      },
      nutritionLog: {
        create: {
          userId,
          logDate: new Date(),
          totalCalories,
          totalProteinG,
          totalCarbsG,
          totalFatG,
          totalFiberG,
          healthScoreAvg: healthScoreAvg || 0,
        },
      },
    });

    return order;
  }

  async getUserOrders(userId: string) {
    return this.ordersRepo.getUserOrders(userId);
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.ordersRepo.getOrderById(orderId, userId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const result = await this.ordersRepo.cancelOrder(orderId, userId);
    if (result.count === 0) {
      throw new BadRequestException('Order cannot be cancelled (not found or not pending)');
    }
    return { success: true };
  }
}