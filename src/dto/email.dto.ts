import { IsEmail, IsString } from 'class-validator';

export class EmailRequestDto {
  @IsEmail()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  content_html: string;

  @IsString()
  content_text: string;
}

export class EmailResponseDto {
    success: boolean;
    message: string;
  }