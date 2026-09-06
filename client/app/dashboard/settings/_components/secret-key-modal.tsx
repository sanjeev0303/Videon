import React, { useState } from "react";
import { X, Check, Copy } from "lucide-react";

interface SecretKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretKey: string;
}

export default function SecretKeyModal({
  isOpen,
  onClose,
  secretKey,
}: SecretKeyModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="relative w-full max-w-md bg-card text-foreground rounded-sm p-6 shadow-xl border border-hairline">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        {/* Glowing Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 blur-xl opacity-30 bg-signal rounded-full w-14 h-14 z-0" />
            <div className="relative z-10 p-3 bg-signal/10 border border-signal/40 rounded-full text-signal">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m0-6h.01M12 9v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-display text-xl font-semibold text-center mb-2">
          Your new secret key
        </h2>
        <div className="text-sm text-muted-foreground space-y-3 text-center mb-6">
          <p>
            Use this key to access Videon APIs, authenticate your app, and
            embed secured videos across your platform.
          </p>
          <p className="text-signal font-medium">
            This key is visible only once. Please store it securely — it
            cannot be retrieved again.
          </p>
          <p>
            If it’s ever compromised, you can regenerate it from this
            dashboard. The previous key will be immediately revoked.
          </p>
          <p className="text-xs text-muted-foreground italic">
            For security reasons, a new key can only be generated once every
            5 minutes.
          </p>
        </div>

        {/* Key Box */}
        <div className="relative bg-muted/40 border border-hairline px-4 py-3 rounded-sm font-mono text-sm mb-6 text-foreground">
          {(secretKey || "").slice(0, 24)}********
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy to clipboard"}
            className="absolute right-3 top-3 text-xs text-signal hover:text-signal/80 transition"
          >
            {copied ? (
              <Check size={16} className="text-signal scale-110" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        {copied && (
          <p className="text-signal text-center -mt-2 mb-3">
            Copied Successfully!
          </p>
        )}

        {/* Footer CTA */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-sm rounded-sm transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}