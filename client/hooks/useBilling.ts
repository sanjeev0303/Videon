import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const useBilling = () => {
  const { getToken } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
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
      if (planData.data?.plan) setCurrentPlan(planData.data.plan);
      if (planData.data?.nextBillingDate) setNextBillingDate(planData.data.nextBillingDate);

      const invoiceRes = await fetch(`${API_URL}/billing/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoiceData = await invoiceRes.json();
      if (invoiceData.data?.invoices) setInvoices(invoiceData.data.invoices);
    } catch (error) {
      console.error('Failed to fetch billing data', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

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
    currentPlan,
    nextBillingDate,
    invoices,
    loading,
    fetchBillingData,
    openPortal,
    checkout,
  };
};
