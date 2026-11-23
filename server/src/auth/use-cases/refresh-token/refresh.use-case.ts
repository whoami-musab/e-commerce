import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RefreshService } from "./refresh.service.js";
import { ConfigService } from "@nestjs/config";
import { RefreshPayload } from "../../../types/session.interface.js";


@Injectable()
export class RefreshUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly refreshService: RefreshService,
        private readonly config: ConfigService
    ) { }

    async execute(token: string) {
        if (!token) {
            throw new UnauthorizedException(
                'Refresh token required!'
            );
        }

        let payload: RefreshPayload;

        // Verify refresh token
        try {
            payload = await this.jwtService.verifyAsync<RefreshPayload>(
                token,
                {
                    secret: this.config.getOrThrow<string>('REFRESH_SECRET')
                })
        } catch (error) {
            throw new UnauthorizedException('Invalid token!')
        }

        if (!payload.sub || !payload.sid) {
            throw new UnauthorizedException('Invalid payload!')
        }

        // Verify Session
        const session = await this.refreshService.verify(
            payload.sid,
            token
        );

        // Ensure token belongs to session owner
        if (session.userId !== payload.sub) {
            throw new UnauthorizedException('Invalid session!')
        }

        // Generate new access token
        const accessToken = await this.jwtService.signAsync(
            { sub: payload.sub },
            {
                secret: this.config.getOrThrow<string>('ACCESS_SECRET'),
                expiresIn: '15m',
            }
        )

        // Rotate refresh token
        const refreshToken = await this.refreshService.rotate(
            session.id,
            payload.sub,
            session.refreshToken,
        )



        // Return AccessToken
        return { success: true, accessToken, refreshToken }
    }
}