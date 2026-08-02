import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

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

export const useBranding = () => {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<WatermarkSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/branding/watermark`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch branding settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching branding settings');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const updateSettings = async (updates: Partial<WatermarkSettings>) => {
    try {
      setIsSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/branding/watermark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const d = await response.json().catch(()=>({}));
        throw new Error(d.message || 'Failed to update branding settings');
      }

      const data = await response.json();
      setSettings(data);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating branding settings');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const uploadWatermark = async (file: File) => {
    try {
      setIsSaving(true);
      setUploadError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/branding/watermark/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const d = await response.json().catch(()=>({}));
        throw new Error(d.message || d.error || 'Failed to upload watermark');
      }

      const data = await response.json();
      setSettings(data);
      return true;
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred while uploading watermark');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    uploadError,
    updateSettings,
    uploadWatermark,
  };
};
