import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant, MenuItem } from '@prisma/client';
import { GetRestaurantsDto } from './dto/get-restaurants.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { OnboardingGuard } from '../auth/guards/onboarding.guard';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  async findAllActive(
    @Query() query: GetRestaurantsDto,
  ): Promise<Restaurant[]> {
    return this.restaurantsService.findAllActive(query.cuisine);
  }

  @Get(':id')
  async findOneById(@Param('id') id: string): Promise<Restaurant> {
    return this.restaurantsService.findOneById(id);
  }

  @Get(':id/menu')
  @UseGuards(JwtGuard, OnboardingGuard)
  async findMenuByRestaurantId(
    @Param('id') id: string,
  ): Promise<(MenuItem & { nutrition?: any })[]> {
    return this.restaurantsService.findMenuByRestaurantId(id);
  }
}
