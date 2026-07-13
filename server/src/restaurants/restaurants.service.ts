import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantsRepository } from './restaurants.repository';
import { Restaurant, MenuItem } from '@prisma/client';
import { ErrorCode } from '../common/errors';

@Injectable()
export class RestaurantsService {
  constructor(private readonly restaurantsRepository: RestaurantsRepository) {}

  async findAllActive(cuisine?: string): Promise<Restaurant[]> {
    return this.restaurantsRepository.findAllActive(cuisine);
  }

  async findOneById(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOneById(id);
    if (!restaurant) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Restaurant not found',
      });
    }

    return restaurant;
  }

  async findMenuByRestaurantId(
    restaurantId: string,
  ): Promise<(MenuItem & { nutrition?: any })[]> {
    await this.findOneById(restaurantId);
    return this.restaurantsRepository.findMenuByRestaurantId(restaurantId);
  }
}
