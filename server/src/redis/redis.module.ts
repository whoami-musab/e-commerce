import { Module } from "@nestjs/common";
import { RedisService } from "./redis.service.js";


@Module({
    controllers: [],
    providers: [RedisService],
    exports: [RedisService],
})

export class RedisModule { }