import { BadRequestException, Injectable, NotFoundException, PreconditionFailedException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { LoginDto } from '../../dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2'
import { ConfigService } from '@nestjs/config';
import { RefreshService } from '../refresh-token/refresh.service.js';

@Injectable()
export class LoginService {
    constructor(
        private readonly refreshService: RefreshService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async execute(dto: LoginDto) {
        // Check empty fields
        if (!dto.username || !dto.password) {
            throw new BadRequestException('All fields are required!')
        }

        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: dto.username },
                    { email: dto.username },
                ],
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                password: true,
                role: true,
            }
        })

        if (!user) {
            throw new UnauthorizedException('Invalid Credentials!')
        }


        const comparePass = await argon2.verify(user.password, dto.password)
        if (!comparePass) {
            throw new UnauthorizedException('Invalid Credentials!')
        }

        // Generate access token
        const accessToken = await this.jwtService.signAsync(
            {
                sub: user.id,
                role: user.role,
            },
            {
                secret: this.configService.getOrThrow<string>('ACCESS_SECRET'),
                expiresIn: '15m'
            }
        )


        // Generate refresh token
        const refreshToken = await this.refreshService.generate(user.id)

        const returnData = performance.now()
        return {
            success: true,
            message: 'Login successfull!',
            accessToken,
            refreshToken: refreshToken.token,
            sessionId: refreshToken.sessionId,
            returnTime: (performance.now() - returnData).toFixed(2)
        }
    }
}