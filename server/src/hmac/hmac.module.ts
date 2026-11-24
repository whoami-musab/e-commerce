import { Module } from "@nestjs/common";
import { HmacService } from "./hmac.service.js";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [],
    controllers: [],
    providers: [HmacService, ConfigService],
    exports: [HmacModule],
})
export class HmacModule { }