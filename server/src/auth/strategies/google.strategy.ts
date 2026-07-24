import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersRepository: UsersRepository) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'DISABLED',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'DISABLED',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return done(new Error('Google OAuth is not configured.'), undefined);
    }

    const email: string = profile.emails?.[0]?.value;
    const name: string = profile.displayName || profile.emails?.[0]?.value;
    const googleId: string = profile.id;

    if (!email) {
      return done(new Error('No email returned from Google'), undefined);
    }

    const user = await this.usersRepository.findOrCreateGoogleUser({
      email,
      name,
      googleId,
    });

    done(null, user);
  }
}
