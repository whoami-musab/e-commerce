import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { LoginService } from './use-cases/login/login.service.js';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/create-user.dto.js';
import { RegisterService } from './use-cases/register/register.service.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginService: LoginService,
        private readonly registerService: RegisterService
    ) { }

    // ========================= Login =========================
    @Throttle({
        short: { limit: 5, ttl: 60000 }
    })
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.loginService.execute(dto)
    }
    // ========================= Login =========================

    // ========================= Register =========================
    @Throttle({
        short: { limit: 3, ttl: 60000 }
    })
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.registerService.execute(dto)
    }
    // ========================= Register =========================
}
