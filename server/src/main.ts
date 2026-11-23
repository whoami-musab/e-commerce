import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { CorsOptions } from 'cors'
import 'dotenv/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expApp = app.getHttpAdapter().getInstance()
  const port = Number(process.env.PORT) || 5000

  const corsOption: CorsOptions = {
    origin: (origin, callback) => {
      const allowedOrigin = process.env.CORS_ALLOWED_HOSTS || ['http://localhost:3000', 'http://127.0.0.0:3000']
      if (!origin || allowedOrigin.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS."), false)
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
    credentials: true,
  }

  app.enableCors(corsOption)

  // Disable X-PoweredBy
  expApp.disable('x-powered-by')

  // Enable Security headers
  app.useSecurityHeaders({
    xFrameOptions: false,
    strictTransportSecurity: { maxAge: 63072000, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1'
  })


  await app.listen(port, '0.0.0.0');
}
await bootstrap();
