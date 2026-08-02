import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(1, "Video title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  tags: z.string().optional().transform((val) => val ? val.split(",").map(t => t.trim()).filter(t => t.length > 0) : []),
  thumbnail: z.any().refine((files) => files?.length === 1, "Thumbnail is required").transform((files) => files[0]),
  timestamps: z.string().optional().transform((val) => val ? val.split("\n").map(l => l.trim()).filter(l => l.length > 0) : []),
  playlist: z.string().optional(),
  generateSubtitles: z.string().optional().transform((val) => val === "true"),
  includeWatermark: z.string().optional().transform((val) => val === "true"),
  video: z.any().refine((files) => files?.length === 1, "Video file is required").transform((files) => files[0]),
});

const mockData = {
  title: "Test",
  slug: "test-slug",
  thumbnail: [ { name: "test.jpg" } ],
  video: [ { name: "test.mp4" } ],
  generateSubtitles: "true",
  includeWatermark: "true"
};

const result = uploadSchema.safeParse(mockData);
if (!result.success) {
  console.log("Validation failed:", result.error.errors);
} else {
  console.log("Validation passed:", result.data);
}
