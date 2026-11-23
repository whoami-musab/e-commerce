import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";

@Injectable()
export class RefreshService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly config: ConfigService
    ) { }

    // Generate refresh token
    async generate(userId: string) {
        // Check empty fields
        if (!userId) {
            throw new UnauthorizedException('Credentials required!')
        }

        // Create session
        const session = await this.prisma.session.create({
            data: {
                userId,
                refreshToken: '',
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                )
            }
        });

        // Generate refresh token
        const token = await this.jwtService.signAsync(
            {
                sub: userId,
                sid: session.id
            },
            {
                secret: this.config.getOrThrow<string>('REFRESH_SECRET'),
                expiresIn: '7d',
            }
        )

        // Hash the token to store it in the database
        const hash = await bcrypt.hash(token, 12)

        // Save hash
        await this.prisma.session.update({
            where: { id: session.id },
            data: { refreshToken: hash }
        })

        // return {token, sessionId}

        return {
            token,
            sessionId: session.id
        }

    }

    // Verify refresh token
    async verify(sessionId: string, token: string) {
        // Check empty fields
        if (!sessionId || !token) {
            throw new UnauthorizedException('Credentials required!')
        }
        // Get specific session
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        })

        // Check invalid session or expires
        if (!session || session.expiresAt <= new Date()) {
            throw new UnauthorizedException('Invalid session!')
        }

        // Check valid session
        const valid = await bcrypt.compare(token, session.refreshToken)

        if (!valid) {
            throw new UnauthorizedException('Invalid token!')
        }

        // Return the session
        return session
    }

    // Create rotate
    async rotate(sessionId: string, userId: string, oldHash: string) {
        // Check empty fields
        if (!sessionId || !userId) {
            throw new UnauthorizedException('Credentials required!')
        }

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // Generate new token
        const newToken = await this.jwtService.signAsync(
            {
                sub: userId,
                sid: sessionId
            },
            {
                secret: this.config.getOrThrow<string>('REFRESH_SECRET'),
                expiresIn: '7d'
            },
        );

        const hash = await bcrypt.hash(newToken, 12);

        // Automatic replacement old token can only used once
        const result = await this.prisma.session.updateMany({
            where: {
                id: sessionId,
                userId,
                refreshToken: oldHash,
                expiresAt: {
                    gt: new Date()
                }
            },
            data: {
                refreshToken: hash,
                expiresAt
            }
        });

        if (result.count !== 1) {
            throw new UnauthorizedException('Refersh token already used!')
        }

        return newToken
    }

}