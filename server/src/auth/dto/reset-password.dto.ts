import { IsString, MinLength, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  otp: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  newPassword: string;
}
