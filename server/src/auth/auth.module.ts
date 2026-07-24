import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule,
    PassportModule,
    CacheModule.register(),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'your-fallback-secret-key-for-development-only',
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' } as any,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
