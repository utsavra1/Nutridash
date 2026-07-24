import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('admin/menu-items')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.RESTAURANT_ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
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
    const url = await this.cloudinaryService.uploadImage(file, 'nutridash/menu-items');
    return { url };
  }

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

  @Get('dashboard/stats')
  async getDashboardStats(@CurrentUser() user: User) {
    return this.adminService.getDashboardStats(user);
  }
}
