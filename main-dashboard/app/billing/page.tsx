"use client";

import React from "react";
import { ChevronRight, CreditCard, Download, ExternalLink } from "lucide-react";
import Link from "next/link";
import PaymentCard from "../../components/cards/payment.card";
import AddOnCard from "../../components/cards/addon.card";
import { useUser } from "@clerk/nextjs";
import { useBilling } from "../../hooks/useBilling";

const Page = () => {
  const { isLoaded } = useUser();
  const { currentPlan, nextBillingDate, invoices, loading, openPortal, checkout } = useBilling();

  const formattedDate = nextBillingDate 
    ? new Date(nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A (Free Plan)';

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="text-foreground">
      {/* Breadcrumb */}
      <nav className="flex items-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>
        <ChevronRight size={14} className="mx-2 opacity-60" />
        <span className="text-foreground font-medium">Billing</span>
      </nav>

      {/* Title */}
      <div className="space-y-1 mb-6">
        <h1 className="font-display text-2xl font-semibold">Billing Settings</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Track your current plan and manage subscription settings.
        </p>
      </div>

      {/* Manage Billing Card */}
      <div className="flex items-center justify-between rounded-sm p-5 mb-6 border border-hairline bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-sm bg-signal/10 border border-signal/20">
            <CreditCard
              size={20}
              className="text-signal"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Manage Billing</h3>
            <p className="text-xs text-muted-foreground">
              Manage your payment methods and billing details through Stripe.
            </p>
            {nextBillingDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Next billing date: <span className="font-medium text-foreground">{formattedDate}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openPortal}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm border border-hairline text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink size={14} />
          Open Stripe Portal
        </button>
      </div>

      {/* Current Plan */}
      <div className="bg-card rounded-sm p-5 mb-6 border border-hairline">
        <div className="mb-4">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Choose the Plan That Fits Your Needs
          </h2>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock more bandwidth, storage, and premium features like{" "}
            <br />
            custom watermark, ad-free player, and real-time support.
          </p>
        </div>

        <div className="w-full grid md:grid-cols-4 gap-5 mb-1">
          <PaymentCard
            name="Free Plan"
            price="$0"
            isCurrent={currentPlan === 'FREE'}
            onClick={() => checkout('FREE')}
            isFree
            features={[
              "5GB storage",
              "only HD (720p) streaming",
              "1,000 playback minutes / month",
              "Advanced analytics",
              "API Access",
              "720p resolution encoding",
              { label: "Custom watermark", available: false },
              { label: "Automatic Subtitle Generations", available: false },
              {
                label: "Multi-bitrate adaptive streaming (360p–1080p)",
                available: false,
              },
              { label: "Full branding", available: false },
            ]}
          />
          <PaymentCard
            name="Starter Plan"
            price={"$19.99"}
            isCurrent={currentPlan === 'STARTER'}
            onClick={() => checkout('STARTER')}
            features={[
              "250GB storage",
              "10,000 playback minutes / month",
              "Advanced analytics",
              "API Access",
              "Multi-bitrate adaptive streaming (360p–1080p)",
              "Custom watermark",
              "Automatic Subtitle Generations",
              "Full branding",
            ]}
          />
          <PaymentCard
            name="Pro Plan"
            price={"$29.99"}
            isCurrent={currentPlan === 'PRO'}
            onClick={() => checkout('PRO')}
            features={[
              "600GB storage",
              "22,000 playback minutes / month",
              "Advanced analytics",
              "API Access",
              "Multi-bitrate adaptive streaming (360p–1080p)",
              "Custom watermark",
              "Automatic Subtitle Generations",
              "Full branding",
            ]}
          />
          <PaymentCard
            name="Business Plan"
            price={"$69.99"}
            isCurrent={currentPlan === 'BUSINESS'}
            onClick={() => checkout('BUSINESS')}
            features={[
              "2TB storage",
              "50,000 playback minutes / month",
              "Advanced analytics",
              "API Access",
              "Multi-bitrate adaptive streaming (360p–1080p)",
              "Custom watermark",
              "Automatic Subtitle Generations",
              "Full branding",
            ]}
          />
        </div>
      </div>

      <div className="bg-card rounded-sm mb-6 p-5 border border-hairline">
        <h2 className="font-display text-lg font-semibold text-foreground mb-1">
          Add-ons
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Extend your bandwidth and storage as your needs grow. Add flexibility
          with custom top-ups.
        </p>

        <div className="grid md:grid-cols-4 gap-5">
          <AddOnCard
            title="100GB Bandwidth"
            price="$5"
            description="Extend your bandwidth limit"
          />
          <AddOnCard
            title="200GB Bandwidth"
            price="$10"
            description="Extend your bandwidth limit"
          />
          <AddOnCard
            title="300GB Bandwidth"
            price="$15"
            description="Extend your bandwidth limit"
          />

          {/* Custom Add-on Card */}
          <div className="rounded-sm border border-hairline p-4 bg-card">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Extra Playback Minutes
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              $5 = 2000 Minutes Playback Add as many Playback Minutes as you
              want.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="number"
                min={5}
                step={5}
                placeholder="Enter $ amount"
                className="px-3 py-1.5 text-sm rounded-sm border border-input bg-muted/40 text-foreground font-mono placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
              />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-sm transition">
                Add Playback Minutes
              </button>
            </div>
          </div>
        </div>
        <br />
        <div className="grid md:grid-cols-4 gap-5">
          <AddOnCard
            title="100GB Storage"
            price="$5"
            description="Extend your storage limit"
          />
          <AddOnCard
            title="200GB Storage"
            price="$10"
            description="Extend your storage limit"
          />
          <AddOnCard
            title="300GB Storage"
            price="$15"
            description="Extend your storage limit"
          />
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-sm p-5 border border-hairline">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Transaction History
        </h3>
        <table className="w-full text-sm text-left">
          <thead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground border-b border-hairline">
            <tr>
              <th className="py-2 font-semibold">Date</th>
              <th className="py-2 font-semibold">Plan</th>
              <th className="py-2 font-semibold">Amount</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-sm text-muted-foreground">
                  No invoices found.
                </td>
              </tr>
            ) : invoices.map((txn, idx) => (
              <tr
                key={idx}
                className="border-b border-hairline hover:bg-muted/50 transition-colors text-foreground"
              >
                <td className="py-3">{new Date(txn.date).toLocaleDateString()}</td>
                <td className="py-3">{txn.plan}</td>
                <td className="py-3 font-mono text-xs">{txn.amount / 100} {txn.currency?.toUpperCase() || 'USD'}</td>
                <td
                  className={`py-3 font-mono text-xs font-medium ${
                    txn.status?.toLowerCase() === "paid"
                      ? "text-signal"
                      : "text-destructive"
                  }`}
                >
                  {txn.status || 'Unknown'}
                </td>
                <td className="py-3">
                  {txn.hosted_invoice_url ? (
                    <a
                      href={txn.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex cursor-pointer items-center gap-1 text-signal hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Invoice
                    </a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;