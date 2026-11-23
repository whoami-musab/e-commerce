import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { LoginDto } from '../../dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { RefreshService } from '../refresh-token/refresh.service.js';

@Injectable()
export class LoginService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly refreshService: RefreshService
    ) { }

    async execute(dto: LoginDto) {
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
            throw new NotFoundException('Invalid Credentials!')
        }

        const comparePass = await bcrypt.compare(dto.password, user.password)
        if (!comparePass) {
            throw new BadRequestException('Invalid Credentials!')
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

        return {
            success: true,
            message: 'Login successfull!',
            accessToken,
            refreshToken: refreshToken.token,
            sessionId: refreshToken.sessionId
        }
    }
}