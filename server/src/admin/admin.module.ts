import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { EdamamService } from './edamam.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, RedisModule, CloudinaryModule],
  providers: [AdminService, AdminRepository, EdamamService],
  controllers: [AdminController],
})
export class AdminModule {}