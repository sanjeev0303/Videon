import { getEnvConfig } from "../configs/index.js"

export const CompleteUpload = async (
    objectId: string,
    uploadId: string,
    key: string,
    parts: string[],
    apiKey: string,
    videoId: string,
) => {
    const { baseUrl } = getEnvConfig()
    const response = await fetch(`${baseUrl}/upload/complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({
            objectId,
            uploadId,
            key,
            parts,
            videoId,
        }),
    });

    const trackingData = await response.json()

    if (!response.ok) {
        const msg = trackingData?.message;
        const readable = Array.isArray(msg) ? msg.join(", ") : msg || trackingData?.error || "Failed to complete the upload upload";
        throw new Error(readable);

    }

    return trackingData;
}
