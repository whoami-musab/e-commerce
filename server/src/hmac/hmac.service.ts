import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class HmacService {
    constructor(private readonly config: ConfigService) { }

    // Hash session token using HMAC-256
    hashToken(token: string) {
        return createHmac(
            'sha256',
            this.config.getOrThrow<string>('HMAC_SECRET'),
        )
            .update(token)
            .digest('hex')
    }

    compareToken(token: string, storedHash: string): boolean {
        // Check the stored hash 
        if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
            return false;
        }
        // Hash token using hashToken func
        const calculatedHash = this.hashToken(token)

        const calculatedBuffer = Buffer.from(calculatedHash, 'hex')
        const storedBuffer = Buffer.from(storedHash, 'hex')

        // Check length
        if (calculatedBuffer.length !== storedBuffer.length) {
            return false
        }

        return timingSafeEqual(calculatedBuffer, storedBuffer)
    }

}



