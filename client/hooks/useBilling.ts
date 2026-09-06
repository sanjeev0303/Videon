import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1';

type BillingData = {
  plan: string;
  nextBillingDate: string | null;
  invoices: any[];
};

export const useBilling = () => {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();

  const fetchBillingData = useCallback(async (): Promise<BillingData> => {
    const token = await getToken();

    const searchParams = new URLSearchParams(window.location.search);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Sync the session to guarantee the plan updates immediately, bypassing the webhook delay
      await fetch(`${API_URL}/billing/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      // Remove session_id from URL without reloading
      const newUrl = window.location.pathname + window.location.search.replace(/(&|\?)session_id=[^&]+/, '');
      window.history.replaceState({}, document.title, newUrl || window.location.pathname);
    }

    const planRes = await fetch(`${API_URL}/billing/current`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const planData = await planRes.json();

    const invoiceRes = await fetch(`${API_URL}/billing/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const invoiceData = await invoiceRes.json();

    return {
      plan: planData.data?.plan ?? 'FREE',
      nextBillingDate: planData.data?.nextBillingDate ?? null,
      invoices: invoiceData.data?.invoices ?? [],
    };
  }, [getToken]);

  const billingQuery = useQuery({
    queryKey: ['billing'],
    queryFn: fetchBillingData,
    enabled: isLoaded,
    staleTime: 2 * 60 * 1000,
  });

  const refetchBilling = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['billing'] });
  }, [queryClient]);

  const openPortal = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/billing/portal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Failed to open portal', error);
    }
  };

  const checkout = async (planTier: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/billing/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planTier })
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error('Failed to checkout', error);
    }
  };

  return {
    currentPlan: billingQuery.data?.plan ?? 'FREE',
    nextBillingDate: billingQuery.data?.nextBillingDate ?? null,
    invoices: billingQuery.data?.invoices ?? [],
    loading: billingQuery.isPending || billingQuery.isFetching,
    fetchBillingData: refetchBilling,
    openPortal,
    checkout,
  };
};