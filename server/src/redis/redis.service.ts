import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject('REDIS_CLIENT')
        private readonly redis: Redis
    ) {
        console.log('🔥 Redis connected!')
    }

    get client() {
        return this.redis
    }


    async onModuleDestroy() {
        await this.redis?.quit()
    }

}