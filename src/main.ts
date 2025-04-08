import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global validation pipe to ensure all incoming requests are validated based on the DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO types
      whitelist: true, // Strip properties that do not have decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are found
    }),
  );

  app.use(cookieParser());

  // 🚀 Apply rate limiting to prevent abuse
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests, please try again later.',
      headers: true, // Send rate limit headers in the response
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
  .setTitle('FX Wallet API')
  .setDescription('API for wallet and currency trading')
  .setVersion('1.0')
  .addSecurity('cookieAuth', {
    type: 'apiKey',
    in: 'cookie',
    name: 'session_id', // exact name of cookie
  })
  .addBearerAuth() // Enables JWT Bearer Authentication in Swagger UI
  
  .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // API docs available at /api-docs

  await app.listen(process.env.PORT ?? 3005);
}

bootstrap();
