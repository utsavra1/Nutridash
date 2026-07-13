import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Controller('admin/menu-items')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post()
  async createMenuItem(@CurrentUser() user: User, @Body() dto: CreateMenuItemDto) {
    return this.adminService.createMenuItem(user, dto);
  }

  @Get()
  async getMenuItems(@CurrentUser() user: User) {
    return this.adminService.getMenuItems(user);
  }

  @Patch(':id')
  async updateMenuItem(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.adminService.updateMenuItem(user, id, dto);
  }

  @Delete(':id')
  async deleteMenuItem(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adminService.deleteMenuItem(user, id);
  }

  @Post(':id/refetch-nutrition')
  async refetchNutrition(@Param('id') id: string, @CurrentUser() user: User) {
    return this.adminService.refetchNutrition(user, id);
  }
}
