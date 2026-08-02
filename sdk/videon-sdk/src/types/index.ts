export type UploadVideoResult = {
    key: string;
}

export type UploadVideoFields = {
    title: string;
    thumbnail: File;
    timestamps?: string[];
    description?: string;
    playlist?: string;
    generateSubtitles?: boolean;
    tags?: string[];
    includeWatermark?: boolean;
    video: File;
}

export type UploadVideoTypes = {
  title: string;
  thumbnailFileName: string;
  videoDuration: number;
  videoFileName: string;
  videoContentType: string;
  videoSize: number;
  thumbnailContentType: string;
  thumbnailSize: number;
  timestamps?: string[];
  description?: string;
  playlist?: string;
  generateSubtitles?: boolean;
  tags?: string[];
  includeWatermark?: boolean;
  type: string;
};

export type VideonOptions = {
    apiKey: string
}
