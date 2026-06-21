import { Body, Controller, Get, Patch, Post, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateHealthProfileDto, UpdateHealthProfileDto } from './dto/health-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    const user = await this.usersService.findById(req.user.id);
    return {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      isOnboardingComplete: user!.isOnboardingComplete,
    };
  }

  @Patch('me')
  async updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateName(req.user.id, dto.name);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboardingComplete: user.isOnboardingComplete,
    };
  }

  @Post('me/health-profile')
  createHealthProfile(@Req() req: AuthenticatedRequest, @Body() dto: CreateHealthProfileDto) {
    return this.usersService.createHealthProfile(req.user.id, dto);
  }

  @Get('me/health-profile')
  getHealthProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getHealthProfile(req.user.id);
  }

  @Patch('me/health-profile')
  updateHealthProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateHealthProfileDto) {
    return this.usersService.updateHealthProfile(req.user.id, dto);
  }
}