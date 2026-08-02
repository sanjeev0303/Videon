import { prisma } from '../utils/prisma';
import type { IApiKeyRepository } from '../interfaces';
import type { ApiKey, Prisma } from '../../generated/prisma/client';

export class ApiKeyRepository implements IApiKeyRepository {
    async create(data: Omit<ApiKey, 'created_at' | 'updated_at'>): Promise<ApiKey> {
        return await prisma.apiKey.create({
            data: data as any,
        });
    }

    async findById(id: string): Promise<ApiKey | null> {
        return await prisma.apiKey.findUnique({
            where: { id },
        });
    }

    async findByValue(value: string): Promise<ApiKey | null> {
        return await prisma.apiKey.findUnique({
            where: { value },
        });
    }

    async findByUserId(userId: string): Promise<Partial<ApiKey>[]> {
        return await prisma.apiKey.findMany({
            where: { user_id: userId, revoked_at: null },
            select: {
                id: true,
                prefix: true,
                created_at: true,
                last_used_at: true,
                revoked_at: true,
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async countByUserId(userId: string): Promise<number> {
        return await prisma.apiKey.count({
            where: { user_id: userId },
        });
    }

    async update(id: string, data: Partial<ApiKey>): Promise<ApiKey> {
        return await prisma.apiKey.update({
            where: { id },
            data,
        });
    }

    async deleteApiKey(userId: string, keyId: string): Promise<void> {
        await prisma.apiKey.updateMany({
            where: {
                id: keyId,
                user_id: userId,
            },
            data: { revoked_at: new Date() },
        });
    }

    async regenerateApiKey(userId: string, keyId: string, newId: string, newHash: string, newPrefix: string): Promise<void> {
        await prisma.apiKey.updateMany({
            where: {
                id: keyId,
                user_id: userId,
            },
            data: {
                id: newId,
                value: newHash,
                prefix: newPrefix,
            },
        });
    }

    async getApiKeyLastUsed(keyId: string): Promise<Date | null> {
        const record = await prisma.apiKey.findUnique({
            where: { id: keyId },
            select: { last_used_at: true }
        });
        
        return record?.last_used_at ?? null;
    }
}
