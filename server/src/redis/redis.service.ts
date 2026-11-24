import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly config: ConfigService) { }

    private client: Redis;

    async onModuleInit() {
        this.client = new Redis(
            this.config.getOrThrow<string>('REDIS_URL')
        );

        await this.client.ping()
    }
    async onModuleDestroy() {
        await this.client?.quit()
    }

    get redis() {
        return this.client
    }

}