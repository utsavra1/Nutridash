import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SuperAdminService } from './super-admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('super-admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(
    private superAdminService: SuperAdminService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.cloudinaryService.uploadImage(file, 'nutridash/restaurants');
    return { url };
  }

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

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.superAdminService.getDashboardStats();
  }
}