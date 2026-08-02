import type { ApiKey } from '../../generated/prisma/client';

export interface IApiKeyRepository {
    create(data: Omit<ApiKey, 'created_at' | 'updated_at'>): Promise<ApiKey>;
    findById(id: string): Promise<ApiKey | null>;
    findByValue(value: string): Promise<ApiKey | null>;
    findByUserId(userId: string): Promise<Partial<ApiKey>[]>;
    countByUserId(userId: string): Promise<number>;
    update(id: string, data: Partial<ApiKey>): Promise<ApiKey>;
    deleteApiKey(userId: string, keyId: string): Promise<void>;
    regenerateApiKey(userId: string, keyId: string, newKeyId: string, hash: string, prefix: string): Promise<void>;
    getApiKeyLastUsed(keyId: string): Promise<Date | null>;
}
