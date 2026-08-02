import crypto from 'crypto';
import * as argon2 from 'argon2';
import type { IApiKeyService, IApiKeyRepository } from '../interfaces';
import type { CreateApiKeyDto, UpdateApiKeyDto } from '../dto';
import type { ApiKey } from '../../generated/prisma/client';
import { extractKeyId, localCache, redisClient } from '../utils';
import { VERSION, LAST_USED_HASH } from '../config';

export class ApiKeyService implements IApiKeyService {
    constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

    private generateKey(): { plaintextKey: string, keyId: string } {
        const keyId = crypto.randomUUID().replace(/-/g, "");
        const secret = crypto.randomBytes(32).toString('base64url');
        const plaintextKey = `VMX_${keyId}_${secret}`;
        return { plaintextKey, keyId };
    }

    async createApiKey(data: CreateApiKeyDto): Promise<{ unhashedKey: string; apiKey: ApiKey }> {
        // Enforce max 5 keys limit
        const count = await this.apiKeyRepository.countByUserId(data.user_id);
        if (count >= 5) {
            throw new Error('You have reached the maximum limit of 5 API keys. Please contact support for more.');
        }

        const { plaintextKey, keyId } = this.generateKey();
        
        const hash = await argon2.hash(plaintextKey, {
            type: argon2.argon2id,
            timeCost: 3,
            memoryCost: 1 << 16,
            parallelism: 1,
        });

        const prefix = plaintextKey.substring(0, 18) + "...";

        const apiKey = await this.apiKeyRepository.create({
            id: keyId,
            name: data.name ?? 'Default Key',
            user_id: data.user_id,
            prefix: prefix,
            value: hash,
            last_used_at: null,
            revoked_at: null,
            expires_at: data.expires_at ?? null,
        });

        return { unhashedKey: plaintextKey, apiKey };
    }

    async getApiKeyById(id: string): Promise<ApiKey | null> {
        return await this.apiKeyRepository.findById(id);
    }

    async validateApiKey(value: string): Promise<ApiKey | null> {
        const keyId = extractKeyId(value);
        if (!keyId) {
            return null;
        }

        const apiKey = await this.apiKeyRepository.findById(keyId);

        if (!apiKey) {
            return null;
        }

        const isValid = await argon2.verify(apiKey.value, value);
        if (!isValid) {
            return null;
        }

        if (apiKey.revoked_at) {
            return null;
        }

        if (apiKey.expires_at && apiKey.expires_at < new Date()) {
            return null;
        }

        this.apiKeyRepository.update(apiKey.id, { last_used_at: new Date() }).catch(err => {
            console.error('Failed to update last_used_at for ApiKey', err);
        });

        return apiKey;
    }

    async listUserApiKeys(userId: string): Promise<Partial<ApiKey>[]> {
        return await this.apiKeyRepository.findByUserId(userId);
    }

    async updateApiKey(id: string, data: UpdateApiKeyDto): Promise<ApiKey> {
        return await this.apiKeyRepository.update(id, data);
    }

    async deleteApiKey(userId: string, keyId: string): Promise<void> {
        await this.apiKeyRepository.deleteApiKey(userId, keyId);
        
        await redisClient.del(`vmx:api_key:${VERSION}:${keyId}`);
        localCache.delete(`${VERSION}:${keyId}`);
    }

    async regenerateApiKey(userId: string, id: string): Promise<{ key: string }> {
        const { plaintextKey, keyId: newKeyId } = this.generateKey();
        const hash = await argon2.hash(plaintextKey, {
            type: argon2.argon2id,
            timeCost: 3,
            memoryCost: 1 << 16,
            parallelism: 1,
        });

        const prefix = plaintextKey.substring(0, 18) + "...";

        await this.apiKeyRepository.regenerateApiKey(userId, id, newKeyId, hash, prefix);

        await redisClient.del(`vmx:api_key:${VERSION}:${id}`);
        localCache.delete(`${VERSION}:${id}`);

        return { key: plaintextKey };
    }

    async getApiKeyLastUsed(keyId: string): Promise<Date | null> {
        const redisValue = await redisClient.hget(LAST_USED_HASH, keyId);
        
        if (redisValue) {
            return new Date(Number(redisValue));
        }

        return this.apiKeyRepository.getApiKeyLastUsed(keyId);
    }
}
