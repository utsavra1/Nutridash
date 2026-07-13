import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ErrorCode } from '../../common/errors';

export interface JwtPayload {
  sub: string;
  role: string;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
  isOnboardingComplete: boolean;
  isSuspended: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'User no longer exists.',
      });
    }

    if (user.isSuspended) {
      throw new UnauthorizedException({
        code: ErrorCode.ACCOUNT_SUSPENDED,
        message: 'This account has been suspended.',
      });
    }

    return {
      id: user.id,
      role: user.role,
      isOnboardingComplete: user.isOnboardingComplete,
      isSuspended: user.isSuspended,
    };
  }
}
