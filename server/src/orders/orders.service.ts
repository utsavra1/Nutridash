import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateHealthScore } from '../common/utils/nutrition';
import { StripeService } from 'src/stripe/stripe.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    private ordersRepo: OrdersRepository,
    private stripeService: StripeService,
    private emailService: EmailService,
  ) {}

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
        name: menuItem.name, // kept for receipt email, stripped before DB insert
      });
    }

    if (restaurantIdSet.size !== 1) {
      throw new BadRequestException('All items must be from the same restaurant');
    }

    const restaurantId = Array.from(restaurantIdSet)[0];
    const healthScoreAvg = healthScores.length > 0 
      ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) 
      : null;

    
    // Strip helper fields before persisting
    const dbOrderItems = orderItemsData.map(({ name: _n, ...rest }) => rest);

    const order = await this.ordersRepo.createOrder({
      userId,
      restaurantId,
      totalPriceRs,
      totalCalories,
      healthScoreAvg,
      deliveryAddress: dto.deliveryAddress,
      stripePaymentId: dto.paymentIntentId,
      orderItems: {
        create: dbOrderItems,
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

    // Send receipt email (fire-and-forget — don't block order response)
    this.ordersRepo.getUserById(userId).then((user) => {
      if (!user) return;
      const restaurant = order.restaurant;
      this.emailService
        .sendOrderReceipt({
          to: user.email,
          customerName: user.name,
          orderId: order.id,
          restaurantName: restaurant?.name ?? 'Restaurant',
          items: orderItemsData.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPriceRs: item.unitPriceRs,
          })),
          totalPriceRs,
          deliveryAddress: dto.deliveryAddress,
          createdAt: new Date(),
        })
        .catch((err) => console.error('❌ Failed to send receipt email:', err));
    });

    return order;
  }

  async getUserOrders(userId: string, page?: number, limit?: number) {
    return this.ordersRepo.getUserOrders(userId, page, limit);
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

  async createPaymentIntentForOrder(dto: CreateOrderDto) {
    console.log('📦 Received createPaymentIntentForOrder DTO:', JSON.stringify(dto, null, 2));
    if (!dto.items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let totalPriceRs = 0;
    const restaurantIdSet = new Set<string>();

    for (const item of dto.items) {
      console.log('🔍 Checking menu item:', item.menuItemId);
      const menuItem = await this.ordersRepo.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        console.error('❌ Menu item not found:', item.menuItemId);
        throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
      }
      if (!menuItem.isAvailable) {
        console.error('❌ Menu item not available:', menuItem.name);
        throw new BadRequestException(`Menu item ${menuItem.name} is not available`);
      }
      restaurantIdSet.add(menuItem.restaurantId);
      totalPriceRs += menuItem.priceRs * item.quantity;
      console.log('💰 Menu item priceRs:', menuItem.priceRs, 'x', item.quantity, '=', menuItem.priceRs * item.quantity);
    }

    console.log('📊 Total priceRs:', totalPriceRs);
    if (restaurantIdSet.size !== 1) {
      console.error('❌ Multiple restaurants in order:', restaurantIdSet);
      throw new BadRequestException('All items must be from the same restaurant');
    }

    console.log('✨ Creating payment intent for amount:', totalPriceRs);
    return this.stripeService.createPaymentIntent(totalPriceRs, 'inr');
  }
}
