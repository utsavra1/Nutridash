import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, HealthProfile } from '../../generated/prisma/client';
import {
  CreateHealthProfileDto,
  UpdateHealthProfileDto,
} from './dto/health-profile.dto';
import { ErrorCode } from '../common/errors';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
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

  async updateName(userId: string, name: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async getHealthProfile(userId: string): Promise<HealthProfile | null> {
    return this.prisma.healthProfile.findUnique({ where: { userId } });
  }

  async createHealthProfile(
    userId: string,
    dto: CreateHealthProfileDto,
  ): Promise<HealthProfile> {
    const existing = await this.prisma.healthProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Health profile already exists. Use update instead.',
      });
    }

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

  async updateHealthProfile(
    userId: string,
    dto: UpdateHealthProfileDto,
  ): Promise<HealthProfile> {
    const existing = await this.prisma.healthProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Health profile not found. Create one first.',
      });
    }

    return this.prisma.healthProfile.update({
      where: { userId },
      data: dto,
    });
  }
}
