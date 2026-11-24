import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface AuthRequest extends Request {
    user?: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private readonly config: ConfigService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthRequest>();

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Access token is required!');
        }

        const [type, token] = authHeader.split(' ');

        if (type !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid authorization format!');
        }

        try {
            const decoded = await this.jwtService.verifyAsync(token, { secret: this.config.getOrThrow<string>('ACCESS_SECRET') });

            if (typeof decoded === 'string') {
                throw new UnauthorizedException('Invalid token payload!');
            }

            request.user = decoded;

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new UnauthorizedException('Invalid or expired token!');
        }
    }
}