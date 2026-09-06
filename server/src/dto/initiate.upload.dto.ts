export interface InitialUploadDto {
    title: string;
    description?: string;
    videoFileName: string;
    videoContentType: string;
    videoSize: number;
    videoDuration: number;
    thumbnailFileName: string;
    thumbnailContentType: string;
    thumbnailSize: number;
    tags?: string[];
    timestamps?: string[];
    playlist?: string;
    generateSubtitles?: boolean;
    includeWatermark?: boolean;
    isPublic?: boolean;
}
