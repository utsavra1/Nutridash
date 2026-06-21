import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, HealthProfile } from '../../generated/prisma/client';
import { CreateHealthProfileDto, UpdateHealthProfileDto } from './dto/health-profile.dto';
import { ErrorCode } from '../common/errors';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.usersRepository.create(data);
  }

  updateName(userId: string, name: string): Promise<User> {
    return this.usersRepository.updateName(userId, name);
  }

  updatePasswordHash(userId: string, passwordHash: string): Promise<User> {
    return this.usersRepository.updatePasswordHash(userId, passwordHash);
  }

  getHealthProfile(userId: string): Promise<HealthProfile | null> {
    return this.usersRepository.findHealthProfile(userId);
  }

  async createHealthProfile(userId: string, dto: CreateHealthProfileDto): Promise<HealthProfile> {
    const existing = await this.usersRepository.findHealthProfile(userId);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Health profile already exists. Use update instead.',
      });
    }
    return this.usersRepository.createHealthProfileAndCompleteOnboarding(userId, dto);
  }

  async updateHealthProfile(userId: string, dto: UpdateHealthProfileDto): Promise<HealthProfile> {
    const existing = await this.usersRepository.findHealthProfile(userId);
    if (!existing) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Health profile not found. Create one first.',
      });
    }
    return this.usersRepository.updateHealthProfile(userId, dto);
  }
}