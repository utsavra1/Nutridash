import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, HealthProfile } from '@prisma/client';
import {
  CreateHealthProfileDto,
  UpdateHealthProfileDto,
} from './dto/health-profile.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: 'CUSTOMER',
      },
    });
  }

  updateName(userId: string, name: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { name } });
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  findHealthProfile(userId: string): Promise<HealthProfile | null> {
    return this.prisma.healthProfile.findUnique({ where: { userId } });
  }

  async createHealthProfileAndCompleteOnboarding(
    userId: string,
    dto: CreateHealthProfileDto,
  ): Promise<HealthProfile> {
    const [healthProfile] = await this.prisma.$transaction([
      this.prisma.healthProfile.create({
        data: {
          userId,
          age: dto.age,
          weightKg: dto.weightKg,
          heightCm: dto.heightCm,
          goal: dto.goal,
          dietaryRestriction: dto.dietaryRestriction,
          allergens: dto.allergens,
          calorieTarget: dto.calorieTarget,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { isOnboardingComplete: true },
      }),
    ]);
    return healthProfile;
  }

  updateHealthProfile(
    userId: string,
    dto: UpdateHealthProfileDto,
  ): Promise<HealthProfile> {
    return this.prisma.healthProfile.update({ where: { userId }, data: dto });
  }
}
