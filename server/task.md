# Task
- Analyze the current architecture of the `server` directory.
- Map the provided NestJS `UploadController` and `UploadService` snippets to the existing Express/Prisma-based architecture.
- Create Express routes for upload actions (`/`, `/complete`, `/webhook`, `/thumbnail`, `/get-videos-metadata`) integrating existing middleware (`clerkAuthMiddleware`, `uploadGuard`).
- Connect multer for thumbnail memory storage on `/thumbnail`.
- Export controllers, services, and routes correctly.
- Fix broken import related to `@oneminutecloud/media-convert`.
- Refactor `UploadService` by extracting database logic into an `UploadRepository` and `IUploadRepository` interface.
- Integrate the newly created `UploadRepository` within the `UploadService` via dependency injection.
- Refactor `getVideosMetadata` to follow the architecture layer standards by pushing the manual join mapping logic directly inside `UploadRepository`, keeping `UploadService` clean and identical to the logic indicated by the reference image.
- Updated `.env` file with missing credentials placeholders for OneMinuteCloud (`ONEMINUTECLOUD_API_KEY`, `ONEMINUTECLOUD_BUCKET_ID`, `ONEMINUTECLOUD_TRANSCODING_BUCKET_ID`).
- Added `WEBHOOK_URL` to `.env` and `appConfig`, and replaced the hardcoded URL in `UploadService.complete`.
- Updated `UploadService.handleWebhook` to properly handle transcoding metadata inserts/updates based on whether they exist, correctly calculate usage deltas, and properly insert/update `Usage` storage based on `BigInt` operations in adherence to the Drizzle ORM reference snippet.
- Created repository abstractions for the new webhook logic (`getTranscodingMetadataByVideoId`, `updateTranscodingMetadata`, `getUsageByUserId`, `createUsage`, `updateUsageStorageById`).
- Migrated video and thumbnail storage from `@oneminutecloud/storage-bucket` to AWS S3.
- Installed `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, and `@types/multer`.
- Added AWS S3 credentials placeholders to `.env` (`AWS_PUBLIC_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`) and exposed them via `appConfig`.
- Refactored `UploadService` to use AWS S3 standard presigned Multipart Uploads for `initiate` and `complete`, and standard S3 `PutObjectCommand` for thumbnails.
- Analyzed and audited the `@videon/sdk` codebase (`/home/sanju/awesome/videon/sdk/videon-sdk`) for logical accuracy and architectural soundness.
- Fixed an issue where the main class `videon` was imported but never exported from `src/index.ts`.
- Fixed the HTTP method in `completeUpload.ts` from `PUT` to `POST` to accurately map to the backend controller route `/api/v1/upload/complete`.
- Addressed case-sensitivity issue in `uploadFile.ts` (changed `part.partNumber` to `part.PartNumber`) and added a resilient default fallback for `partSize` extraction for AWS S3 multipart uploading chunks.
- Fixed a type mismatch in `UploadVideoTypes` where `thumbnailSize` was incorrectly typed as `string` instead of `number`.
- Verified the build pipeline (`npm run build`) runs correctly and cleanly generates `dist/` artifacts (`index.cjs`, `index.js`, `index.d.ts`).

## Status
Completed
