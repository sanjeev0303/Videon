import type { Request, Response } from 'express';
import type { IApiKeyService } from '../interfaces';
import type { CreateApiKeyDto, UpdateApiKeyDto } from '../dto';

export class ApiKeyController {
    constructor(private readonly apiKeyService: IApiKeyService) {}

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const data: CreateApiKeyDto = req.body;
            const userId = req.user?.id;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            data.user_id = userId; // Override with authenticated user

            const result = await this.apiKeyService.createApiKey(data);
            res.status(201).json({
                message: 'API Key created successfully',
                unhashedKey: result.unhashedKey,
                apiKey: result.apiKey
            });
        } catch (error: any) {
            console.error('Error creating API key:', error);
            res.status(500).json({ error: error.message || 'Internal server error' });
        }
    };

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const apiKeys = await this.apiKeyService.listUserApiKeys(userId);
            res.status(200).json(apiKeys);
        } catch (error) {
            console.error('Error listing API keys:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            await this.apiKeyService.deleteApiKey(userId, id as string);
            res.status(200).json({ message: 'API Key revoked successfully' });
        } catch (error) {
            console.error('Error revoking API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    regenerate = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const result = await this.apiKeyService.regenerateApiKey(userId, id as string);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error regenerating API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    validate = async (req: Request, res: Response): Promise<void> => {
        try {
            const { key } = req.body;
            if (!key) {
                res.status(400).json({ error: 'key is required in body' });
                return;
            }

            const apiKey = await this.apiKeyService.validateApiKey(key);
            if (!apiKey) {
                res.status(401).json({ error: 'Invalid, expired, or revoked API key' });
                return;
            }

            res.status(200).json({ message: 'API Key is valid', apiKey });
        } catch (error) {
            console.error('Error validating API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    lastUsed = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const lastUsedDate = await this.apiKeyService.getApiKeyLastUsed(id as string);
            res.status(200).json({ last_used_at: lastUsedDate });
        } catch (error) {
            console.error('Error fetching API key last used:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
