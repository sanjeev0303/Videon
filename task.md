# Task: Analyze images and implement config

- [x] Analyze provided images at pixel level.
- [x] Extract configuration constants, Redis key functions, types (`CachedKey`, `CachedPlan`, `CachedUsage`), and enum (`PlanTier`) with normalization function (`normalizePlanTier`).
- [x] Implement extracted contents in `/home/sanju/awesome/videon/server/src/config/index.ts`.

# Task: Implement Player Service Architecture
- [x] Analyze provided NestJS code snippet.
- [x] Translate NestJS modules, Drizzle ORM, and JWT to Express, Prisma, and standard jsonwebtoken logic.
- [x] Create `player.service.ts` for database fetching and OneMinuteCloud streaming.
- [x] Create `player.controller.ts` for the route handler.
- [x] Create `player.route.ts` and protect it using `clerkAuthMiddleware`.
- [x] Add JWT Secret configuration into `appConfig`.

# Task: Rename Vidmox to Videon in react/index.tsx
- [x] Analyze `sdk/videon-player/src/react/index.tsx` and change Vidmox to Videon.


# Task: Implement Analytics Service
- [x] Analyze the given NestJS snippet.
- [x] Translate Drizzle ORM to Prisma.
- [x] Implement getAnalytics and getMainAnalytics in AnalyticsService.
- [x] Add getAnalytics and getMainAnalytics to AnalyticsController.
- [x] Add routes in AnalyticsRoute protected by Clerk auth.

# Task: Implement Analytics Dashboard UI
- [x] Create `useAnalytics` and `useMainAnalytics` hooks for fetching analytics data.
- [x] Update `GeographicalMap` to accept dynamic country data via props.
- [x] Integrate real data into `app/page.tsx` for the dashboard overview.
- [x] Integrate real data into `app/analytics/page.tsx` for the full analytics view.
- [x] Resolve thumbnail 404 issue by explicitly constructing AWS S3 URLs in frontend UI instead of relying on relative key paths.
- [x] Map ISO region codes to actual country names in GeographicalMap to resolve geo locations not visible in UI.
- [x] Include totalViews query in getVideosMetadata API and render video views in the My Videos page which was previously hardcoded.
- [x] Fix analytics page showing zeros: topVideos now falls back to cumulative totalViews when daily range has no data.
- [x] Fix unit conversion: minute_streamed (minutes) and average_view_duration (minutes) now properly converted to seconds for UI display.
- [x] Replace mock deviceData in analytics page with real device breakdown aggregated from video_analytics device strings.

# Task: Implement Billing API and Dashboard Integration
- [x] Analyze the provided NestJS Billing code snippet.
- [x] Translate Drizzle ORM data models to Prisma schema (`stripe_customer_id`, `stripe_subscription_id` to Plan model).
- [x] Create `billing.repository.ts`, `billing.service.ts`, `billing.controller.ts`, `billing.route.ts` matching the current server Express/Prisma architecture.
- [x] Configure stripe credentials in `.env`.
- [x] Connect the `/billing/current`, `/billing/portal`, `/billing/checkout`, and `/billing/invoices` endpoints with the `main-dashboard` billing page using a custom `useBilling.ts` hook.
- [x] Make `nextBillingDate` dynamic in the billing dashboard UI using `useBilling` hook and the real Stripe subscription data.

# Task: Implement Player Settings
- [x] Analyze Drizzle ORM schema for player_metadata.
- [x] Create getSettings and updateSettings in PlayerController.
- [x] Add /settings routes to PlayerRoute.
- [x] Create usePlayerSettings hook in main-dashboard.
- [x] Connect usePlayerSettings hook to PlayerSettingsPage.

# Task: Fix Checkout Sync and Webhook Issues
- [x] Fix empty payment_invoice table by syncing invoice from Stripe subscription object if session.invoice is missing during checkout sync.
- [x] Fix plan updating to free by ensuring robust stripe sync.
- [x] Verified BigInt serialization patch is applied globally in Express app to prevent 500 errors.

# Task: Integrate Player Settings with Dashboard UI
- [x] Expand `PlayerSettings` type in backend service and frontend hook to include `controls` and `playButton.customIcon`.
- [x] Integrate `enabledControls` array from Player Settings page into backend payload.
- [x] Integrate custom upload icon as a base64 string submission to the backend payload and handle conditionally rendering it in UI.
- [x] Update sanitization logic in PlayerService to securely parse and default `controls` array and `customIcon` string.

# Task: Implement Player Guard Middleware
- [x] Create `player.middleware.ts` and implement `playerGuard`.
- [x] Reuse existing Prisma and Redis caching logic for plan and usage resolution.
- [x] Apply `playerGuard` to the player routes to enforce streaming limits.

# Task: Implement Branding Architecture
- [x] Defined `WatermarkMetadata` schema in Prisma.
- [x] Implemented `BrandingRepository` for DB access.
- [x] Implemented `BrandingService` mirroring original logic.
- [x] Implemented `BrandingController` and `BrandingRoute` with `multer`.
- [x] Integrated `BrandingRoute` into global routing.

# Task: Implement Branding Dashboard UI
- [x] Create `useBranding` hook in main-dashboard.
- [x] Integrate API into `app/branding/page.tsx` for fetching and updating settings.
- [x] Implement conditional rendering based on plan tier.
- [x] Add watermark image upload via FormData and handle live UI preview.

# Task: Finalize Rebranding
- [x] Perform global search for "Vidmox" strings in codebase.
- [x] Update references to Videon in SDK exports and error handling.
- [x] Update Dashboard metadata, branding strings, and security tab URLs.
- [x] Update Landing page metadata, CTA text, and feature descriptions.

# Task: Configuration files (.gitignore & .dockerignore)
- [x] Create root `.gitignore` and `.dockerignore`.
- [x] Create `.dockerignore` files for `server`, `main-dashboard`, and `landing`.
- [x] Create `.gitignore` for `sdk`.
