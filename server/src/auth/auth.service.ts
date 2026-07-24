import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ErrorCode } from '../common/errors';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { OtpService } from './otp.service';

const SALT_ROUNDS = 10;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnboardingComplete: boolean;
}

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isOnboardingComplete: user.isOnboardingComplete,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  /** Step 1 of registration — send OTP to email */
  async sendOtp(email: string): Promise<void> {
    const otp = await this.otpService.createOtp(email);
    await this.emailService.sendOtp(email, otp);
  }

  /** Step 2 of registration — verify OTP, then create account */
  async verifyOtpAndRegister(
    dto: RegisterDto & { otp: string },
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const valid = await this.otpService.verifyOtp(dto.email, dto.otp);
    if (!valid) {
      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'Invalid or expired verification code.',
      });
    }

    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const tokens = this.generateTokens(user.id, user.role);
    return { user: toSafeUser(user), tokens };
  }

  async login(dto: LoginDto): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password.',
      });
    }

    if (user.isSuspended) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_SUSPENDED,
        message: 'This account has been suspended.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password.',
      });
    }

    const tokens = this.generateTokens(user.id, user.role);
    return { user: toSafeUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid or expired refresh token.',
      });
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.isSuspended) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid refresh token.',
      });
    }

    return this.generateTokens(user.id, user.role);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User not found.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Current password is incorrect.',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepository.updatePasswordHash(userId, newPasswordHash);
  }

  /** Called after Google OAuth validates the user — issues JWT tokens */
  googleLogin(user: User): { user: SafeUser; tokens: TokenPair } {
    const tokens = this.generateTokens(user.id, user.role);
    return { user: toSafeUser(user), tokens };
  }

  /** Step 1 of forgot-password — send OTP to email if account exists */
  async sendPasswordResetOtp(email: string): Promise<void> {
    // Always return success even if email not found — prevents user enumeration
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return;

    const otp = await this.otpService.createPasswordResetOtp(email);
    await this.emailService.sendPasswordResetOtp(email, otp);
  }

  /** Step 2 of forgot-password — verify OTP then set new password */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const valid = await this.otpService.verifyPasswordResetOtp(email, otp);
    if (!valid) {
      throw new BadRequestException({
        code: 'INVALID_OTP',
        message: 'Invalid or expired verification code.',
      });
    }

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException({
        code: ErrorCode.NOT_FOUND,
        message: 'Account not found.',
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepository.updatePasswordHash(user.id, newPasswordHash);
  }

  private generateTokens(userId: string, role: string): TokenPair {
    const accessToken = this.jwtService.sign(
      { sub: userId, role },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: (process.env.JWT_ACCESS_EXPIRY ||
          '15m') as JwtSignOptions['expiresIn'],
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, role },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRY ||
          '7d') as JwtSignOptions['expiresIn'],
      },
    );

    return { accessToken, refreshToken };
  }
}
