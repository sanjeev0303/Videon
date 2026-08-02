import type { ApiKey } from '../../generated/prisma/client';
import type { CreateApiKeyDto, UpdateApiKeyDto } from '../dto';

export interface IApiKeyService {
    createApiKey(data: CreateApiKeyDto): Promise<{ unhashedKey: string; apiKey: ApiKey }>;
    getApiKeyById(id: string): Promise<ApiKey | null>;
    validateApiKey(value: string): Promise<ApiKey | null>;
    listUserApiKeys(userId: string): Promise<Partial<ApiKey>[]>;
    updateApiKey(id: string, data: UpdateApiKeyDto): Promise<ApiKey>;
    deleteApiKey(userId: string, keyId: string): Promise<void>;
    regenerateApiKey(userId: string, keyId: string): Promise<{ key: string }>;
    getApiKeyLastUsed(keyId: string): Promise<Date | null>;
}
