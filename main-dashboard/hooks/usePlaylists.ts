import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

export const usePlaylists = () => {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const fetchPlaylists = async () => {
    const token = await getToken();
    if (!token) throw new Error("No token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/playlists`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch playlists");
    return res.json();
  };

  const playlistsQuery = useQuery({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
    enabled: isLoaded,
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/playlists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create playlist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/playlists/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to update playlist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}/playlists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete playlist");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  return {
    playlistsQuery,
    createPlaylistMutation,
    updatePlaylistMutation,
    deletePlaylistMutation,
  };
};
