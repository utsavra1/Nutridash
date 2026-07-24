import { IsString, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Please provide a valid email address.' })
  email: string;
}
