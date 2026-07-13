import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsRepository } from './restaurants.repository';

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsRepository, RestaurantsService],
  exports: [RestaurantsRepository, RestaurantsService],
})
export class RestaurantsModule {}
