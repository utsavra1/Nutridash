import { Injectable, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { NutritionRepository } from './nutrition.repository';
import { calculateHealthScore } from '../common/utils/nutrition';

@Injectable()
export class NutritionService {
  constructor(
    private nutritionRepo: NutritionRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getHealthScore(menuItemId: string, userId: string) {
    const nutrition = await this.nutritionRepo.getNutritionInfo(menuItemId);
    const profile = await this.nutritionRepo.getHealthProfile(userId);

    if (!nutrition) {
      return null;
    }
    if (!profile) {
      throw new NotFoundException('Health profile not found');
    }

    return calculateHealthScore(
      {
        calories: nutrition.calories,
        proteinG: nutrition.proteinG,
        carbsG: nutrition.carbsG,
        fatG: nutrition.fatG,
        fiberG: nutrition.fiberG,
      },
      profile,
    );
  }

  async getHealthierAlternatives(menuItemId: string, userId: string) {
    const currentScore = await this.getHealthScore(menuItemId, userId);
    if (!currentScore || currentScore >= 50) {
      return [];
    }

    const currentItem = await this.nutritionRepo.getMenuItemById(menuItemId);

    if (!currentItem) {
      throw new NotFoundException('Menu item not found');
    }

    const profile = await this.nutritionRepo.getHealthProfile(userId);
    if (!profile) {
      throw new NotFoundException('Health profile not found');
    }

    const allMenuItems = await this.nutritionRepo.getRestaurantMenuItems(
      currentItem.restaurantId,
    );
    const alternatives = allMenuItems
      .filter((item) => item.id !== menuItemId && item.nutrition)
      .map((item) => ({
        item,
        score: calculateHealthScore(
          {
            calories: item.nutrition!.calories,
            proteinG: item.nutrition!.proteinG,
            carbsG: item.nutrition!.carbsG,
            fatG: item.nutrition!.fatG,
            fiberG: item.nutrition!.fiberG,
          },
          profile,
        ),
      }))
      .filter(({ score }) => score > currentScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return alternatives;
  }

  async getWeeklyDashboard(userId: string) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const nutritionLogs = await this.nutritionRepo.getNutritionLogs(
      userId,
      oneWeekAgo,
    );

    interface DailyAggregate {
      date: string;
      totalCalories: number;
      totalProteinG: number;
      totalCarbsG: number;
      totalFatG: number;
      totalFiberG: number;
      healthScores: number[];
    }

    const dailyAggregates = nutritionLogs.reduce(
      (acc, log) => {
        const dateKey = log.logDate.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            totalCalories: 0,
            totalProteinG: 0,
            totalCarbsG: 0,
            totalFatG: 0,
            totalFiberG: 0,
            healthScores: [],
          };
        }
        acc[dateKey].totalCalories += log.totalCalories;
        acc[dateKey].totalProteinG += log.totalProteinG;
        acc[dateKey].totalCarbsG += log.totalCarbsG;
        acc[dateKey].totalFatG += log.totalFatG;
        acc[dateKey].totalFiberG += log.totalFiberG;
        acc[dateKey].healthScores.push(log.healthScoreAvg);
        return acc;
      },
      {} as Record<string, DailyAggregate>,
    );

    const dailyData = Object.values(dailyAggregates).map(
      (day: DailyAggregate) => ({
        ...day,
        healthScoreAvg: Math.round(
          day.healthScores.reduce(
            (sum: number, score: number) => sum + score,
            0,
          ) / day.healthScores.length,
        ),
      }),
    );

    const totalCalories = dailyData.reduce(
      (sum, day) => sum + day.totalCalories,
      0,
    );
    const totalProteinG = dailyData.reduce(
      (sum, day) => sum + day.totalProteinG,
      0,
    );
    const totalCarbsG = dailyData.reduce(
      (sum, day) => sum + day.totalCarbsG,
      0,
    );
    const totalFatG = dailyData.reduce((sum, day) => sum + day.totalFatG, 0);

    return {
      dailyData,
      totalCalories,
      totalProteinG,
      totalCarbsG,
      totalFatG,
    };
  }
}
