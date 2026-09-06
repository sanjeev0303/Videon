import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export type VideoMetadata = {
  id: string;
  title: string;
  description: string | null;
  thumbnailTrackingId: string | null;
  videoTrackingId: string | null;
  status: string;
  isPublic: boolean;
  publicSlug: string | null;
  playlist_id: string | null;
  playlist_name?: string;
  created_at: string;
  totalViews: number;
};

export const useVideos = () => {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const fetchVideos = async (): Promise<VideoMetadata[]> => {
    const token = await getToken();
    if (!token) throw new Error("No token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/upload/get-videos-metadata`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch videos");
    return res.json();
  };

  const videosQuery = useQuery({
    queryKey: ["videos"],
    queryFn: fetchVideos,
    enabled: isLoaded,
  });

  return {
    videosQuery,
  };
};

// Standalone so video detail pages can toggle visibility without
// subscribing to the full video list query.
export const useToggleVideoPublic = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      videoId,
      isPublic,
    }: {
      videoId: string;
      isPublic: boolean;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/upload/toggle-public/${videoId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isPublic }),
        },
      );
      if (!res.ok) throw new Error("Failed to update visibility");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({
        queryKey: ["videoMetadata", variables.videoId],
      });
    },
  });
};