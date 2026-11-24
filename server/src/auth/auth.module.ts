import { Module } from '@nestjs/common';
import { LoginService } from './use-cases/login/login.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshService } from './use-cases/refresh-token/refresh.service.js';
import { RegisterService } from './use-cases/register/register.service.js';
import { AuthController } from './auth.controller.js';
import { HmacService } from '../hmac/hmac.service.js';
import { RefreshUseCase } from './use-cases/refresh-token/refresh.use-case.js';
import { LogoutUseCase } from './use-cases/logout/logout.use-case.js';

@Module({
    providers: [LoginService, RegisterService, PrismaService, JwtService, RefreshService, HmacService, RefreshUseCase, LogoutUseCase],
    exports: [LoginService, RegisterService, RefreshService, RefreshUseCase, LogoutUseCase],
    controllers: [AuthController]
})
export class AuthModule { }
