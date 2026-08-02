import { getEnvConfig } from "../configs/index.js";

type ThumbnailUploadParams = {
  apiKey: string;
  videoId: string;
  thumbnail: File;
  thumbnailFileName: string;
  thumbnailContentType: string;
  thumbnailSize: number;
};

export const thumbnailUpload = async ({
  apiKey,
  videoId,
  thumbnail,
  thumbnailFileName,
  thumbnailContentType,
  thumbnailSize,
}: ThumbnailUploadParams): Promise<{ thumbnailKey: string }> => {
  const { baseUrl } = getEnvConfig();

  const formData = new FormData();

  formData.append("videoId", videoId);
  formData.append("thumbnail", thumbnail);
  formData.append("thumbnailFileName", thumbnailFileName);
  formData.append("thumbnailContentType", thumbnailContentType);
  formData.append("thumbnailSize", String(thumbnailSize));

  const response = await fetch(`${baseUrl}/upload/thumbnail`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data?.message || data.error || "Failed to upload thumbnail";

    throw new Error(msg);
  }

  return data;
};
