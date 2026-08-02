import { getEnvConfig } from "../configs/index.js";
import { UploadVideoTypes } from "../types/index.js";

export const initiateUpload = async (
    body: UploadVideoTypes,
    apiKey: string,
) => {
    const { baseUrl } = getEnvConfig();
    const response = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({
            ...body,
        }),
    });

    const uploadData = await response.json()

    if (!response.ok) {
        const msg = uploadData?.message;
        const readable = Array.isArray(msg) ? msg.join(", ") : msg || uploadData?.error || "Failed to initiate upload";
        throw new Error(readable);

    }

    return uploadData;
}
