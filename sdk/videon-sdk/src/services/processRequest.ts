import { verifyApiKeySignature } from "../utils/apiKeySignature.js";
import { CompleteUpload } from "./completeUpload.js";
import { initiateUpload } from "./initiateUpload.js";
import { thumbnailUpload } from "./uploadThumbnail.js";

export async function handleProcessRequest({
  request,
  apiKey,
}: {
  request: Request;
  apiKey: string;
}) {
  try {
    // 1. Validate API Key Presence
    if (!apiKey) {
      return Response.json(
        { error: "Videon apiKey is required" },
        { status: 401 },
      );
    }

    // 2. Verify API Key Signature
    const isValid = await verifyApiKeySignature(apiKey);

    if (!isValid) {
      return Response.json(
        { error: "Your API key is invalid!" },
        { status: 401 },
      );
    }

    const contentType = request.headers.get("content-type") || "";

    // 3. Handle Multipart Form-Data Requests (e.g., Thumbnail Uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const type = formData.get("type");

      if (!type || typeof type !== "string") {
        return Response.json({ error: "Type is required" }, { status: 400 });
      }

      switch (type) {
        case "upload-thumbnail": {
          const videoId = formData.get("videoId");
          const thumbnail = formData.get("thumbnail");
          const thumbnailFileName = formData.get("thumbnailFileName");
          const thumbnailContentType = formData.get("thumbnailContentType");
          const thumbnailSize = formData.get("thumbnailSize");

          if (!videoId || typeof videoId !== "string") {
            return Response.json(
              { error: "videoId is required" },
              { status: 400 },
            );
          }

          if (!(thumbnail instanceof File)) {
            return Response.json(
              { error: "Thumbnail file is required" },
              { status: 400 },
            );
          }

          const thumbnailUploadResult = await thumbnailUpload({
            apiKey,
            videoId,
            thumbnail,
            thumbnailFileName:
              typeof thumbnailFileName === "string"
                ? thumbnailFileName
                : thumbnail.name,
            thumbnailContentType:
              typeof thumbnailContentType === "string"
                ? thumbnailContentType
                : thumbnail.type,
            thumbnailSize:
              typeof thumbnailSize === "string"
                ? Number(thumbnailSize)
                : thumbnail.size,
          });

          return Response.json({ thumbnailData: thumbnailUploadResult });
        }
        default:
          return Response.json({ error: "Invalid type" }, { status: 400 });
      }
    }

    // 4. Handle Standard JSON Body Requests
    const body = await request.json();
    const { type, ...rest } = body;

    if (!type) {
      return Response.json({ error: "Type is required" }, { status: 400 });
    }

    switch (type) {
      case "upload": {
        const result = await initiateUpload(rest, apiKey);
        return Response.json({ uploadData: result });
      }
      case "complete": {
        const uploadResult = await CompleteUpload(
          rest.objectId,
          rest.uploadId,
          rest.key,
          rest.parts,
          apiKey,
          rest.videoId,
        );

        return Response.json({ trackingData: uploadResult });
      }
      default:
        return Response.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (error: any) {
    const message = error?.message || "An unexpected error occurred";
    return Response.json({ error: message }, { status: 500 });
  }
}
