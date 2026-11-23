import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { LoginService } from './use-cases/login/login.service.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginService: LoginService
    ) { }

    // ========================= Login =========================
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.loginService.execute(dto)
    }
    // ========================= Login =========================
}
