import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { NutritionRepository } from './nutrition.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NutritionService, NutritionRepository],
  controllers: [NutritionController],
})
export class NutritionModule {}
