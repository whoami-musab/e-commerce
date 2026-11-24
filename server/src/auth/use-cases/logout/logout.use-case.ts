import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshService } from "../refresh-token/refresh.service.js";
import { RefreshPayload } from "../../../types/session.interface.js";


@Injectable()
export class LogoutUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly refreshService: RefreshService,
    ) { }

    async execute(token: string) {

        if (!token) {
            throw new UnauthorizedException('Credentials required!')
        }

        let payload: RefreshPayload;

        // Verify refresh token
        try {
            payload = await this.jwtService.verifyAsync<RefreshPayload>(
                token,
                {
                    secret: this.config.getOrThrow<string>('REFRESH_SECRET')
                }
            );
        } catch (error) {
            throw new UnauthorizedException('Invalid payload!')
        }

        if (!payload.sub || !payload.sid) {
            throw new UnauthorizedException('Invalid payload!')
        }

        // Delete session from redis
        await this.refreshService.revoke(payload.sid, payload.sub)

        return {
            success: true,
            message: "logged out successfully!"
        }
    }
}