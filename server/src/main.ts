
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import 'dotenv/config';
import type { CorsOptions } from 'cors';
import cookieParser from 'cookie-parser'
import { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const expApp = app.getHttpAdapter().getInstance();

  const port = Number(process.env.PORT) || 5000;

  // CORS
  const allowedOrigins = (
    process.env.CORS_ALLOWED_HOSTS ??
    'http://localhost:3000,http://127.0.0.1:3000'
  )
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  const corsOption: CorsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };

  app.enableCors(corsOption)

  // Security
  expApp.disable('x-powered-by');

  app.use(cookieParser());

  app.use(
    helmet({
      frameguard: {
        action: 'deny',
      },
      strictTransportSecurity:
        process.env.NODE_ENV === 'production'
          ? {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true,
          }
          : false,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Routing
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  await app.listen(port, '0.0.0.0');
}

await bootstrap();
