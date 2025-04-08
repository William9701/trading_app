import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ,
      port: +process.env.SMTP_PORT! ,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string) {
    const mailOptions = {
      from: `"Your App" <${process.env.SMTP_SENDER}>`,
      to: email,
      subject: 'Welcome to Our Platform!',
      text: 'Thank you for registering. We’re excited to have you on board!',
    };

    try {
      this.logger.log(`Sending welcome email to ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email} with response: ${info.response}`);
      if (info.rejected.length > 0) {
        this.logger.error('Rejected email addresses:', info.rejected);
      }
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, recipientName: string, otpCode: string) {
    const mailOptions = {
      from: `"Your App" <${process.env.SMTP_SENDER}>`,
      to: email,
      subject: 'Verify your Account!',
      html: `<!DOCTYPE html>
              <html>
              <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Verification</title>
              <style>
                  body {
                      font-family: Arial, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                  }
                  .container {
                      border: 1px solid #ddd;
                      border-radius: 5px;
                      padding: 20px;
                      background-color: #f9f9f9;
                  }
                  .code {
                      font-size: 24px;
                      font-weight: bold;
                      color: #0066cc;
                      padding: 10px;
                      text-align: center;
                      margin: 20px 0;
                      background-color: #eee;
                      border-radius: 5px;
                  }
                  .footer {
                      margin-top: 30px;
                      font-size: 12px;
                      color: #777;
                      text-align: center;
                  }
              </style>
              </head>
              <body>
              <div class="container">
                  <h2>Email Verification</h2>
                  <p>Hello ${recipientName},</p>
                  <p>Thank you for registering with FXFlow. Please use the verification code below to complete your registration:</p>
                  <div class="code">${otpCode}</div>
                  <p>This code will expire in 10 minutes.</p>
                  <p>If you did not request this code, please ignore this email.</p>
                  <p>Best regards,<br>The FXFlow Team</p>
              </div>
              <div class="footer">
                  <p>This is an automated message. Please do not reply to this email.</p>
                  <p>&copy; ${new Date().getFullYear()} FXFlow. All rights reserved.</p>
              </div>
              </body></html>`,
    };

    try {
      this.logger.log(`Sending verification email to ${email}`);
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email} with response: ${info.response}`);
      if (info.rejected.length > 0) {
        this.logger.error('Rejected email addresses:', info.rejected);
      }
    } catch (error) {
      this.logger.error('Error sending verification email:', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
