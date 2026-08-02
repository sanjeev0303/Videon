export interface CreateApiKeyDto {
    name?: string;
    user_id: string;
    expires_at?: Date;
}

export interface UpdateApiKeyDto {
    name?: string;
}
