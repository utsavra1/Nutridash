import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}), // secrets are passed per-call, not globally — see auth.service.ts
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}