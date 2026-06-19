import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — all routes served under /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS — only allow requests from the frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe — strip unknown fields, reject invalid ones
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.APP_PORT || 3001);
  console.log(`Server running on http://localhost:${process.env.APP_PORT || 3001}/api/v1`);
}

bootstrap();