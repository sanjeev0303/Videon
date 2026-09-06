import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type WatermarkSettings = {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  fileKey: string | null;
  lastUploadAt: string | null;
  nextUploadAvailableAt: string | null;
  canCustomize: boolean;
  plan: string;
};

const API_URL = process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1';

export const useBranding = () => {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<WatermarkSettings>({
    queryKey: ['branding', 'watermark'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/branding/watermark`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branding settings');
      }

      return response.json();
    },
    enabled: isLoaded,
    staleTime: 60 * 1000,
  });

  const updateMutation = useMutation<WatermarkSettings, Error, Partial<WatermarkSettings>>({
    mutationFn: async (updates) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/branding/watermark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to update branding settings');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['branding', 'watermark'], data);
    },
  });

  const uploadMutation = useMutation<WatermarkSettings, Error, File>({
    mutationFn: async (file) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/branding/watermark/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Failed to upload watermark');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['branding', 'watermark'], data);
    },
  });

  const updateSettings = useCallback(
    async (updates: Partial<WatermarkSettings>) => {
      try {
        await updateMutation.mutateAsync(updates);
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation],
  );

  const uploadWatermark = useCallback(
    async (file: File) => {
      try {
        await uploadMutation.mutateAsync(file);
        return true;
      } catch {
        return false;
      }
    },
    [uploadMutation],
  );

  return {
    settings: settingsQuery.data ?? null,
    isLoading: settingsQuery.isPending,
    isSaving: updateMutation.isPending || uploadMutation.isPending,
    error: settingsQuery.error?.message ?? updateMutation.error?.message ?? null,
    uploadError: uploadMutation.error?.message ?? null,
    updateSettings,
    uploadWatermark,
  };
};