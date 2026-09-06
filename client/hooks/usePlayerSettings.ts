import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

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

export const usePlayerSettings = () => {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/player/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching player settings');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const updateSettings = async (newSettings: PlayerSettings) => {
    try {
      setIsSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/player/settings`, {
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

      const data = await response.json();
      setSettings(data);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating player settings');
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
    updateSettings,
  };
};
