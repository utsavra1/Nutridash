import {
  Body,
  Controller,
  Post,
  Patch,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtGuard } from './guards/jwt.guard';
import { ErrorCode } from '../common/errors';
import type { AuthenticatedUser } from './strategies/jwt.strategy';

const REFRESH_COOKIE_NAME = 'refresh_token';

function getSameSite(): 'lax' | 'strict' | 'none' {
  const value = process.env.COOKIE_SAMESITE;
  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }
  return 'lax';
}

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    await this.authService.sendOtp(dto.email);
    return { message: 'Verification code sent to your email.' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto & { otp: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.verifyOtpAndRegister(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string | undefined = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'No refresh token provided.',
      });
    }

    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: getSameSite(),
    });
    return { message: 'Logged out successfully.' };
  }

  @UseGuards(JwtGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully.' };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.sendPasswordResetOtp(dto.email);
    // Always return the same message to prevent user enumeration
    return { message: 'If an account with that email exists, a reset code has been sent.' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
    return { message: 'Password reset successfully. You can now log in.' };
  }

  // ── Google OAuth ───────────────────────────────────────────────────────────

  @SkipThrottle()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google — nothing to do here
  }

  @SkipThrottle()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { user, tokens } = this.authService.googleLogin(req.user);
    this.setRefreshCookie(res, tokens.refreshToken);

    // Redirect to the frontend callback page with the access token and onboarding flag
    const frontendBase = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboardingComplete: String(user.isOnboardingComplete),
    });
    res.redirect(`${frontendBase}/auth/google/callback?${params.toString()}`);
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: getSameSite(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
  }
}
