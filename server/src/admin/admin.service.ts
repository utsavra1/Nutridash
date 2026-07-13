import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';
import { EdamamService } from './edamam.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { User } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private adminRepo: AdminRepository,
    private edamamService: EdamamService,
  ) {}

  async createMenuItem(user: User, dto: CreateMenuItemDto) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant admin only');
    }

    const menuItem = await this.adminRepo.createMenuItem({
      ...dto,
      restaurantId: user.restaurantId,
      nutritionStatus: 'PENDING',
    });

    // Fetch nutrition data in background
    this.fetchAndSaveNutrition(menuItem.id, menuItem.name).catch((err) => {
      console.error('Failed to fetch nutrition:', err);
    });

    return menuItem;
  }

  async updateMenuItem(user: User, id: string, dto: UpdateMenuItemDto) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant admin only');
    }

    const result = await this.adminRepo.updateMenuItem(id, dto, user.restaurantId);
    if (result.count === 0) {
      throw new NotFoundException('Menu item not found');
    }

    return this.adminRepo.getMenuItemById(id, user.restaurantId);
  }

  async deleteMenuItem(user: User, id: string) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant admin only');
    }

    const result = await this.adminRepo.deleteMenuItem(id, user.restaurantId);
    if (result.count === 0) {
      throw new NotFoundException('Menu item not found');
    }

    return { success: true };
  }

  async getMenuItems(user: User) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant admin only');
    }
    return this.adminRepo.getMenuItems(user.restaurantId);
  }

  async refetchNutrition(user: User, id: string) {
    if (!user.restaurantId) {
      throw new ForbiddenException('Restaurant admin only');
    }

    const menuItem = await this.adminRepo.getMenuItemById(id, user.restaurantId);
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    await this.adminRepo.updateNutritionStatus(id, 'PENDING');
    await this.fetchAndSaveNutrition(id, menuItem.name);

    return this.adminRepo.getMenuItemById(id, user.restaurantId);
  }

  private async fetchAndSaveNutrition(menuItemId: string, itemName: string) {
    try {
      const nutritionData = await this.edamamService.fetchNutrition(menuItemId, itemName);
      if (nutritionData) {
        await this.adminRepo.upsertNutritionInfo({
          menuItemId,
          ...nutritionData,
        });
        await this.adminRepo.updateNutritionStatus(menuItemId, 'FETCHED');
      } else {
        await this.adminRepo.updateNutritionStatus(menuItemId, 'FAILED');
      }
    } catch (error) {
      console.error('Error saving nutrition data:', error);
      await this.adminRepo.updateNutritionStatus(menuItemId, 'FAILED');
    }
  }
}