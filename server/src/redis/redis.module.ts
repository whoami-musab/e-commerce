import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service.js";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";

@Global()
@Module({
    controllers: [],
    providers: [RedisService, {
        provide: 'REDIS_CLIENT',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
            return new Redis({
                host: config.getOrThrow<string>('REDIS_HOST'),
                port: config.get<number>('REDIS_PORT'),
                maxRetriesPerRequest: 3,
            });
        },
    }],
    exports: [RedisService],
})

export class RedisModule { }