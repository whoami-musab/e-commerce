import { Module } from '@nestjs/common';
import { LoginService } from './use-cases/login/login.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshService } from './use-cases/refresh-token/refresh.service.js';
import { RegisterService } from './use-cases/register/register.service.js';
import { AuthController } from './auth.controller.js';

@Module({
    providers: [LoginService, RegisterService, PrismaService, JwtService, RefreshService],
    exports: [LoginService, RegisterService, RefreshService],
    controllers: [AuthController]
})
export class AuthModule { }
