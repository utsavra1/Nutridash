import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('nutrition')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class NutritionController {
  constructor(private nutritionService: NutritionService) {}

  @Get('score')
  async getHealthScore(
    @Query('menuItemId') menuItemId: string,
    @CurrentUser() user: User,
  ) {
    const score = await this.nutritionService.getHealthScore(
      menuItemId,
      user.id,
    );
    return { score };
  }

  @Get('alternatives')
  async getAlternatives(
    @Query('menuItemId') menuItemId: string,
    @CurrentUser() user: User,
  ) {
    const alternatives = await this.nutritionService.getHealthierAlternatives(
      menuItemId,
      user.id,
    );
    return { alternatives };
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: User) {
    return this.nutritionService.getWeeklyDashboard(user.id);
  }
}
