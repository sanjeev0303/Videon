import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export type VideoMetadata = {
  id: string;
  title: string;
  description: string | null;
  thumbnailTrackingId: string | null;
  videoTrackingId: string | null;
  status: string;
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

  // We could add deleteVideoMutation here if needed later

  return {
    videosQuery,
  };
};
