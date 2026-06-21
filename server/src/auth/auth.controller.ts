import { Body, Controller, Post, Req, Res, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ErrorCode } from '../common/errors';

const REFRESH_COOKIE_NAME = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens.refreshToken);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken: string | undefined = req.cookies?.[REFRESH_COOKIE_NAME];
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
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
    });
    return { message: 'Logged out successfully.' };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_REFRESH_EXPIRY
      path: '/api/v1/auth',
    });
  }
}