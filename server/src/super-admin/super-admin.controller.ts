import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('super-admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Post('restaurants')
  async createRestaurant(@Body() dto: CreateRestaurantDto) {
    return this.superAdminService.createRestaurant(dto);
  }

  @Get('restaurants')
  async getRestaurants() {
    return this.superAdminService.getRestaurants();
  }

  @Get('restaurants/:id')
  async getRestaurantById(@Param('id') id: string) {
    return this.superAdminService.getRestaurantById(id);
  }

  @Patch('restaurants/:id')
  async updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.superAdminService.updateRestaurant(id, dto);
  }

  @Get('users')
  async getUsers() {
    return this.superAdminService.getUsers();
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.superAdminService.getUserById(id);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.superAdminService.updateUser(id, dto);
  }

  @Get('orders')
  async getAllOrders(
    @Query('restaurantId') restaurantId?: string,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.getAllOrders({ restaurantId, status });
  }
}