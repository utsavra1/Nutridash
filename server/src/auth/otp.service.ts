import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const OTP_TTL_SECONDS = 600; // 10 minutes

@Injectable()
export class OtpService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /** Generate a 6-digit OTP, store it in Redis, return the code */
  async createOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.key(email);
    await this.cache.set(key, otp, OTP_TTL_SECONDS * 1000); // cache-manager v5 uses ms
    return otp;
  }

  /** Returns true and deletes the key if OTP matches, false otherwise */
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = this.key(email);
    const stored = await this.cache.get<string>(key);
    if (!stored || stored !== otp) return false;
    await this.cache.del(key);
    return true;
  }

  /** Generate a password-reset OTP stored under a separate prefix */
  async createPasswordResetOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.resetKey(email);
    await this.cache.set(key, otp, OTP_TTL_SECONDS * 1000);
    return otp;
  }

  /** Verify (and consume) a password-reset OTP */
  async verifyPasswordResetOtp(email: string, otp: string): Promise<boolean> {
    const key = this.resetKey(email);
    const stored = await this.cache.get<string>(key);
    if (!stored || stored !== otp) return false;
    await this.cache.del(key);
    return true;
  }

  private key(email: string): string {
    return `otp:${email.toLowerCase()}`;
  }

  private resetKey(email: string): string {
    return `otp:reset:${email.toLowerCase()}`;
  }
}
