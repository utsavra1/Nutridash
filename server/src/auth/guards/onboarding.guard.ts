import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ErrorCode } from '../../common/errors';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

@Injectable()
export class OnboardingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      // JwtGuard should have already rejected this — defensive check only
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Authentication required.',
      });
    }

    if (!user.isOnboardingComplete) {
      throw new ForbiddenException({
        code: ErrorCode.ONBOARDING_INCOMPLETE,
        message: 'Please complete your health profile before continuing.',
      });
    }

    return true;
  }
}
