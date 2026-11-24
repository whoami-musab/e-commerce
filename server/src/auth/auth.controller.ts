import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';
import { LoginService } from './use-cases/login/login.service.js';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/create-user.dto.js';
import { RegisterService } from './use-cases/register/register.service.js';
import { RefreshUseCase } from './use-cases/refresh-token/refresh.use-case.js';
import type { Response, Request } from 'express'
import { LogoutUseCase } from './use-cases/logout/logout.use-case.js';
import { setRefreshCookie } from '../utils/cookie.utils.js';




@Controller('auth')
export class AuthController {
    constructor(
        private readonly loginService: LoginService,
        private readonly registerService: RegisterService,
        private readonly refreshUseCase: RefreshUseCase,
        private readonly logoutService: LogoutUseCase
    ) { }

    // ========================= Login =========================
    @Throttle({
        short: { limit: 5, ttl: 60000 }
    })
    @Post('login')
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.loginService.execute(dto)

        setRefreshCookie(res, result.accessToken)

        return {
            success: true,
            accessToken: result.accessToken
        }
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

    // ========================= Logout =========================

    @Throttle({
        short: { limit: 3, ttl: 60000 }
    })
    @Post('logout')
    async logout(@Req() req: Request, @Res() res: Response) {
        const token = req.cookies?.refreshToken
        const result = await this.logoutService.execute(token)

        res.clearCookie("refreshToken",
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            })

        return {
            success: true,
            result
        }
    }


    // ========================= Logout =========================



    // ========================= Session =========================
    @Throttle({
        short: { limit: 10, ttl: 60000 }
    })
    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.cookies?.refreshToken

        // Check empty fields
        if (!token) {
            throw new UnauthorizedException('Refresh token is required');
        }

        const result = await this.refreshUseCase.execute(token);

        setRefreshCookie(res, result.accessToken)

        return {
            accessToken: result.accessToken
        }
    }
    // ========================= Session =========================


}
