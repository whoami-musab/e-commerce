import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth/auth.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { RedisModule } from './redis/redis.module.js';
import { LogoutUseCase } from './auth/use-cases/logout/logout.use-case.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'mid',
        ttl: 10000,
        limit: 30,
      },
      {
        name: 'high',
        ttl: 60000,
        limit: 100,
      },
    ]),
    JwtModule,
    PrismaModule,
    AuthModule,
    RedisModule
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
