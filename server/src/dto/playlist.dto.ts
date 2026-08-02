export interface CreatePlaylistDto {
    name: string;
    description?: string;
    user_id?: string;
    limit?: number;
}

export interface UpdatePlaylistDto {
    name?: string;
    description?: string;
    limit?: number;
}
