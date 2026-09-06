import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type PlayerSettings = {
  primaryColor?: string;
  fontFamily?: string;
  controls?: string[];
  captions?: {
    fontColor?: string;
    backgroundColor?: string;
    fontSize?: number;
  };
  playButton?: {
    preset?: 'classic' | 'minimal' | 'block';
    customIcon?: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1';

export const usePlayerSettings = () => {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<PlayerSettings>({
    queryKey: ['player-settings'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/player/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player settings');
      }

      return response.json();
    },
    enabled: isLoaded,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation<PlayerSettings, Error, PlayerSettings>({
    mutationFn: async (newSettings) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/player/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update player settings');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['player-settings'], data);
    },
  });

  const updateSettings = useCallback(
    async (newSettings: PlayerSettings) => {
      try {
        await updateMutation.mutateAsync(newSettings);
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation],
  );

  return {
    settings: settingsQuery.data ?? null,
    isLoading: settingsQuery.isPending,
    isSaving: updateMutation.isPending,
    error: settingsQuery.error?.message ?? updateMutation.error?.message ?? null,
    updateSettings,
  };
};