import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ConfigService } from "@nestjs/config";
import { HmacService } from "../../../hmac/hmac.service.js";
import { RedisService } from "../../../redis/redis.service.js";

@Injectable()
export class RefreshService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly hmac: HmacService,
        private readonly redis: RedisService
    ) { }

    // Generate refresh token
    async generate(userId: string) {
        // Check empty fields
        if (!userId) {
            throw new UnauthorizedException('Credentials required!')
        }

        // Gen RandomUUID for sessionId
        const sessionId = crypto.randomUUID()

        // Gen token
        const token = await this.jwtService.signAsync(
            {
                sub: userId,
                sid: sessionId,
            },
            {
                secret: this.config.getOrThrow<string>('REFRESH_SECRET'),
                expiresIn: '7d',
            }
        )

        // Hash token
        const hash = this.hmac.hashToken(token)

        // Gen session
        const session = {
            userId,
            refreshToken: hash,
            createdAt: new Date().toISOString()
        }

        // Store to redis
        await this.redis.client.set(
            `session:${sessionId}`,
            JSON.stringify(session),
            'EX',
            7 * 24 * 60 * 60
        );

        return {
            token,
            sessionId
        }

    }

    // Verify refresh token
    async verify(sessionId: string, token: string) {
        // Check empty fields
        if (!sessionId || !token) {
            throw new UnauthorizedException('Credentials required!')
        }
        // Get specific session
        const data = await this.redis.client.get(
            `session:${sessionId}`
        )

        // Check invalid session or expires
        if (!data) {
            throw new UnauthorizedException('Invalid session!')
        }

        const session = JSON.parse(data)

        // Check valid session
        const valid = this.hmac.compareToken(token, session.refreshToken)

        if (!valid) {
            throw new UnauthorizedException('Invalid token!')
        }

        // Return the session
        return {
            id: sessionId,
            ...session
        }
    }

    // Create rotate
    async rotate(sessionId: string, userId: string, oldHash: string) {
        // Check empty fields
        if (!sessionId || !userId || !oldHash) {
            throw new UnauthorizedException('Credentials required!')
        }

        const expiresIn = 7 * 24 * 60 * 60;

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

        const newHash = this.hmac.hashToken(newToken)

        // Automatic replacement old token can only used once
        const script = `
            local data = redis.call('GET', KEYS[1])

            if not data then
                return 0
            end

            local session = cjson.decode(data)

            if session.userId ~= ARGV[1] then
                return 0
            end

            session.refreshToken ~= ARGV[2] then
                return 0
            end

            session.refreshToken ~= ARGV[3]

            redis.call(
                'SET',
                KEYS[1],
                cjson.encode(session),
                'EX',
                ARGV[4]
            )
            
            return 1
        `;

        const result = await this.redis.client.eval(
            script,
            1,
            `session:${sessionId}`,
            userId,
            oldHash,
            newHash,
            expiresIn.toString()
        );

        if (result !== 1) {
            throw new UnauthorizedException('Refersh token already used or invalid session!')
        }

        return newToken
    }

    async revoke(sessionId: string, userId: string) {
        // Check empty fields
        if (!sessionId || !userId) {
            throw new BadRequestException('Credentials required!')
        }

        const key = `session:${sessionId}`

        // Get session
        const data = await this.redis.client.get(key)

        if (!data) {
            throw new UnauthorizedException('Invalid session!')
        }

        let session;

        try {
            session = JSON.parse(data)
        } catch (error) {
            throw new UnauthorizedException('Invalid session!')
        }



        if (session.userId !== userId) {
            throw new UnauthorizedException('Invalid session!')
        }

        await this.redis.client.del(key)


        return {
            success: true
        }

    }

}