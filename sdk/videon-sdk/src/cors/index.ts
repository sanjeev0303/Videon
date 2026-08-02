import { UploadVideoFields, UploadVideoResult } from "../types/index.js";
import { handleApiError } from "../utils/handleApiError.js";
import { uploadFile } from "../services/uploadFile.js";

type onProgressType = {
    onProgress?: (progress: {
        loaded: number;
        total: number;
        percent: number;
    }) => void;
}

export interface FileMeta {
    filename: string;
    contentType: string;
    size: number;
}

function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        if (!file.type.startsWith("video/")) {
            resolve(0);
            return;
        }

        const video = document.createElement("video");
        video.preload = "metadata"

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(Math.round(video.duration))
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(0)
        };

        video.src = URL.createObjectURL(file);
    })
}

function extractFileMeta(file: File | Buffer | Uint8Array): FileMeta {
    // Check if running in a browser environment where 'File' is defined
    if (typeof File !== "undefined" && file instanceof File) {
        return {
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
        };
    }

    // Fallback for Node.js Buffer or Uint8Array environments
    return {
        filename: "upload",
        contentType: "application/octet-stream",
        size: (file as Buffer | Uint8Array).byteLength,
    };
}

class Videon {
    static async uploadVideo(options: UploadVideoFields, onProgress?: onProgressType, alternateProxyUrl?: string): Promise<UploadVideoResult> {
        if (!options.video) {
            throw new Error(" Video vile is required");
        }

        if (!(options.video instanceof File)) {
            throw new Error("Invalid video file.");
        }

        if (!options.video.type.startsWith("video/")) {
            throw new Error("The video file must need to be a valid video file");
        }

        if (!options.thumbnail) {
            throw new Error("thumbnail is required");
        }

        if (!options.thumbnail.type.startsWith("image/")) {
            throw new Error("The thumbnail file must need to be a valid image file");
        }

        if (!options.title || options.title.trim() === "") {
            throw new Error("Title is required");
        }

        const videoDuration = await getVideoDuration(options.video);

        const {
            filename: videoFileName,
            contentType: videoContentType,
            size: videoSize
        } = extractFileMeta(options.video);

        const {
            filename: thumbnailFileName,
            contentType: thumbnailContentType,
            size: thumbnailSize
        } = extractFileMeta(options.thumbnail)

        const requestForwardUrl = alternateProxyUrl || "/api/videon";
        const initialResponse = await fetch(requestForwardUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...(() => {
                    const { video, thumbnail, ...rest } = options;
                    return rest;
                })(),
                videoDuration,
                videoFileName,
                videoContentType,
                videoSize,
                thumbnailFileName,
                thumbnailContentType,
                thumbnailSize,
                type: "upload",
            })
        })

        if (!initialResponse.ok) {
            await handleApiError(initialResponse, "initiate")
        }

        const { uploadData } = await initialResponse.json()

        const { objectId, key, uploadId, completedParts } = await uploadFile(options.video, uploadData, onProgress);

        const completeResponse = await fetch(requestForwardUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "complete",
                objectId,
                uploadId,
                key,
                parts: completedParts,
                videoId: uploadData?. videoId,
            }),
        });

        if (!completeResponse.ok) {
            await handleApiError(completeResponse, "complete")
        }

        await completeResponse.json();

        const thumbnailFormData = new FormData();
        thumbnailFormData.append("type", "upload-thumbnail");
        thumbnailFormData.append("videoId", uploadData?.videoId);
        thumbnailFormData.append("thumbnail", options.thumbnail);
        thumbnailFormData.append("thumbnailFileName", thumbnailFileName);
        thumbnailFormData.append("thumbnailContentType", thumbnailContentType);
        thumbnailFormData.append("thumbnailSize", String(thumbnailSize));

        const uploadThumbnailResponse = await fetch(requestForwardUrl, {
            method: "POST",
            body: thumbnailFormData,
        });

        if(!uploadThumbnailResponse.ok){
            await handleApiError(uploadThumbnailResponse, "complete")
        }

        await uploadThumbnailResponse.json();

        return{key};
    }
}

export const videon = Videon;
