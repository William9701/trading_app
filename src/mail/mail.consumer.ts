import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { EmailService } from '../mail/mail.service';

@Injectable()
export class EmailConsumer implements OnModuleInit {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly emailService: EmailService
  ) {}

  async onModuleInit() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for RabbitMQService
      await this.rabbitMQService.consumeQueue(async (msg) => {
        const { type, email, recipientName, otpCode } = JSON.parse(msg.content.toString());
        if (!type || !email) {
          this.logger.warn(`Invalid message format: ${msg.content.toString()}`);
          this.rabbitMQService.nackMessage(msg); // Don't requeue!
          return;
        }
        this.logger.log(`Received message for email: ${email} with type: ${type}`);

        let retryCount = 0;
        const maxRetries = 3;

        // Retry logic for sending email
        while (retryCount < maxRetries) {
          try {
            if (type === 'verification') {
              // Handle OTP verification email
              await this.emailService.sendVerificationEmail(email, recipientName, otpCode);
              this.rabbitMQService.ackMessage(msg);
              this.logger.log(`Verification email sent to ${email}`);
            } else if (type === 'welcome') {
              // Handle Welcome email
              await this.emailService.sendWelcomeEmail(email);
              this.rabbitMQService.ackMessage(msg);
              this.logger.log(`Welcome email sent to ${email}`);
            } else {
              this.logger.warn(`Unknown email type: ${type}`);
              this.rabbitMQService.nackMessage(msg);
            }
            break; // Exit loop if email is sent successfully
          } catch (error) {
            retryCount++;
            this.logger.error(`Attempt ${retryCount} failed for ${email}`, error);

            if (retryCount === maxRetries) {
              this.rabbitMQService.nackMessage(msg); // Requeue message after max retries
              this.logger.error(`Message failed after ${maxRetries} attempts. Requeued.`);
            }
          }
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize email consumer', error);
    }
  }
}
