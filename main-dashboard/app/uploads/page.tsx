"use client";

import { ChevronRight, RefreshCcw, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { videon } from "@videon/sdk";
import { usePlaylists } from "@/hooks/usePlaylists";
import { toast } from "sonner";

// Define the schema using Zod
const uploadSchema = z.object({
  title: z.string().min(1, "Video title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [],
    ),
  thumbnail: z
    .any()
    .refine((val) => val instanceof File, "Thumbnail is required"),
  timestamps: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
        : [],
    ),
  playlist: z.string().optional(),
  generateSubtitles: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  includeWatermark: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  video: z
    .any()
    .refine((val) => val instanceof File, "Video file is required"),
});

type UploadFormValues = z.input<typeof uploadSchema>;
type UploadFormOutput = z.output<typeof uploadSchema>;

const Page = () => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<UploadFormValues, any, UploadFormOutput>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      generateSubtitles: "true",
      includeWatermark: "true",
    },
  });

  const [isDragging, setIsDragging] = useState(false);

  // Auto-generate slug on initial mount if empty
  useEffect(() => {
    const randomSlug = `video-${Math.random().toString(36).substring(7)}`;
    setValue("slug", randomSlug);
  }, [setValue]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const router = useRouter();
  const { isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadStartRef = useRef<number>(0);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s reamining`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s reamining`;
  };

  const { playlistsQuery } = usePlaylists();
  const { data: playlists, isLoading, error } = playlistsQuery;

  const resetForm = () => {
    reset();
    setVideoPreview(null);
    setUploadProgress(0);
    setEstimatedTime(null);
    setIsUploading(false);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }

  const onSubmit = async (data: UploadFormOutput) => {
    try {
      setIsUploading(true);
      uploadStartRef.current = Date.now();
      try {
        await videon.uploadVideo(data, {
          onProgress: (p:any) => {
            setUploadProgress(p.percent);
            if (p.percent > 0) {
              const elapsed = (Date.now() - uploadStartRef.current) / 1000;
              const speed = p.percent / elapsed;
              const reamining = (100 - p.percent) / speed;

              setEstimatedTime(formatTime(reamining));
            }
          },
        });

        resetForm();
        toast.success(
            "Video uploaded successfully! Currently the video is getting processed to make it available for watching.",
            {
                position: "bottom-right",
                duration: 5000,
            },
        )
      } catch (error: any) {
        toast.error(error.message || "Failed to upload video", {
          position: "bottom-right",
          duration: 5000,
        });
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  const generateSlug = () => {
    const randomSlug = `video-${Math.random().toString(36).substring(7)}`;
    setValue("slug", randomSlug, { shouldValidate: true });
  };

  const triggerBrowse = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setValue("video", file, { shouldValidate: true });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handled by Controller onChange - kept only as fallback
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoPreview(null);
    setValue("video", undefined, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {!isLoaded ? (
        <div></div>
      ) : (
        <div className="text-slate-900 dark:text-slate-50 relative min-h-screen">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
            <Link
              href="/"
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight size={16} className="mx-2" />
            <span className="text-slate-900 dark:text-slate-200 font-medium">
              Upload Video
            </span>
          </nav>

          {/* Title & Subtitle */}
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Upload Video</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Easily upload and manage your video content.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit, (err) => console.log('Validation Errors:', err))} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Video Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter video title"
                    className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50"
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.title.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      {...register("slug")}
                      placeholder="Auto-generated slug"
                      className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateSlug}
                      title="Generate Slug"
                      className="shrink-0 border dark:border-gray-800/50 dark:bg-slate-900 dark:hover:bg-slate-800!"
                    >
                      <RefreshCcw
                        size={16}
                        className="dark:text-white text-black"
                      />
                    </Button>
                  </div>
                  {errors.slug && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.slug.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    rows={5}
                    placeholder="Enter a description about the video"
                    className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    {...register("tags")}
                    placeholder="e.g. tutorial, react, programming"
                    className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50"
                  />
                </div>

                <div className="grid grid-cols-1">
                  <div className="space-y-2">
                    <Label htmlFor="includeWatermark">Include Watermark?</Label>
                    <select
                      {...register("includeWatermark")}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="thumbnail">
                    Thumbnail Image <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="thumbnail"
                    control={control}
                    render={({ field: { onChange, ref } }) => (
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        ref={ref}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          onChange(file ?? undefined);
                        }}
                        className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50 cursor-pointer file:cursor-pointer file:text-slate-700 dark:file:text-slate-300"
                      />
                    )}
                  />
                  {errors.thumbnail && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.thumbnail.message as string}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timestamps">Timestamps (optional)</Label>
                  <Textarea
                    id="timestamps"
                    {...register("timestamps")}
                    rows={5}
                    placeholder={
                      "00:00 Introduction\n01:30 Main Topic\n05:00 Conclusion"
                    }
                    className="bg-slate-50 border dark:border-gray-800/50 dark:bg-slate-900/50 resize-none font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="playlist">Playlist</Label>
                    <select
                      {...register("playlist")}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    >
                      <option value="">
                        {isLoading ? "Loading..." : "Select a Playlist"}
                      </option>
                      {playlists?.map((pl: { id: string; name: string }) => (
                        <option value={pl.id} key={pl.id}>
                          {pl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generateSubtitles">
                      Generate Subtitles?
                    </Label>
                    <select
                      {...register("generateSubtitles")}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800/50 dark:bg-slate-900/50 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800/50 my-8" />

            {/* Video Upload Area */}
            <div className="space-y-2">
              <Label>
                Video File <span className="text-red-500">*</span>
              </Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={triggerBrowse}
                className={`
              relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-200
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-4 ring-blue-500/10"
                  : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }
              ${videoPreview ? "p-4" : "p-10"}
            `}
              >
                {videoPreview ? (
                  <div
                    className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <video
                      src={videoPreview}
                      controls
                      className="w-full aspect-video"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full h-8 w-8"
                      onClick={removeVideo}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                      <UploadCloud size={32} className="text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        MP4, WebM or Ogg (Max. 2GB)
                      </p>
                    </div>
                  </div>
                )}
                <Controller
                  name="video"
                  control={control}
                  render={({ field: { onChange, ref } }) => (
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      ref={(e) => {
                        ref(e);
                        fileInputRef.current = e;
                      }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          const url = URL.createObjectURL(file);
                          setVideoPreview(url);
                        }
                      }}
                    />
                  )}
                />
              </div>
              {errors.video && (
                <p className="text-xs text-red-500 font-medium mt-2">
                  {errors.video.message as string}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                className="dark:bg-slate-800 dark:text-white cursor-pointer"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-30 cursor-pointer"
              >
                Upload Video
              </Button>
            </div>

            {/* Upload Overlay */}
            {isUploading && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-semibold">
                      Uploading Video...
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Please do not close this window
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span>{uploadProgress}% Complete</span>
                      <span>{estimatedTime || "Calculating..."}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
};

export default Page;
