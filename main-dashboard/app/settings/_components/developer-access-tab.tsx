import React, { useState } from "react";
import { Plus } from "lucide-react";
import { format } from "timeago.js";
import { useApiKeys } from "@/hooks/useApiKeys";
import SecretKeyModal from "./secret-key-modal";

export default function DeveloperAccessTab() {
  const { keysQuery, generateMutation, regenerateMutation, revokeMutation } = useApiKeys();
  const { data: apiKeys, isLoading, error } = keysQuery;

  const [secretKey, setSecretKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ id: string; type: "regenerate" | "revoke" } | null>(null);

  const isCooldownActive = (updatedAt: string) => {
    if (!updatedAt) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - new Date(updatedAt).getTime() < fiveMinutes;
  };

  const handleGenerateSecretKey = async () => {
    try {
      const data = await generateMutation.mutateAsync();
      setSecretKey(data.unhashedKey);
      setShowKeyModal(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRegenerateKey = async (id: string) => {
    try {
      setActionLoading({ id, type: "regenerate" });
      const data = await regenerateMutation.mutateAsync(id);
      setSecretKey(data.key || data.unhashedKey || "");
      setShowKeyModal(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this key? Any application using it will lose access.")) return;
    try {
      setActionLoading({ id, type: "revoke" });
      await revokeMutation.mutateAsync(id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="md:w-[60%] space-y-6">
      {/* Guidelines */}
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>
          Developer secret keys are used to programmatically access the
          Videon API and embed secured videos. Do{" "}
          <span className="text-foreground font-medium">not share</span> your
          secret key publicly or with third parties.
        </p>
        <p>
          If any suspicious or unauthorized activity is detected using
          your key, we may notify you via email. However, it is solely
          your responsibility to keep your keys secure.
        </p>
        <p>
          If you suspect your key is compromised, you can immediately{" "}
          <span className="text-signal font-medium">regenerate</span>{" "}
          it below.
        </p>
        <p>
          To further protect your content, you can configure{" "}
          <span className="text-foreground font-medium">
            whitelisted domains
          </span>{" "}
          that are allowed to access your embedded videos. Requests from
          any other domain will be blocked.
        </p>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-display text-base font-semibold text-foreground">
          Developer Secret Keys
        </h2>
      </div>

      {/* Key List */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading keys...</div>
      ) : error ? (
        <div className="text-sm text-destructive">{(error as Error).message}</div>
      ) : apiKeys && apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((key: any) => (
            <div key={key.id} className="bg-card border border-hairline rounded-sm px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Key ID: {key.id}
                  </p>
                  <p className="mt-1 font-mono text-foreground tracking-wider">
                    {key.prefix || "********************"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Created at:{" "}
                    <span className="text-foreground">{new Date(key.created_at).toLocaleDateString()}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last used:{" "}
                    <span className="text-foreground">
                      {key.last_used_at ? format(key.last_used_at) : "Never"}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    disabled={(actionLoading?.id === key.id && actionLoading?.type === "regenerate") || isCooldownActive(key.updated_at)}
                    title={isCooldownActive(key.updated_at) ? "You can only regenerate a key once every 5 minutes" : ""}
                    className="text-xs px-2 py-1 rounded-sm border border-signal/60 text-signal hover:bg-signal/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    onClick={() => handleRegenerateKey(key.id)}
                  >
                    {actionLoading?.id === key.id && actionLoading?.type === "regenerate" ? "Regenerating..." : isCooldownActive(key.updated_at) ? "Cooldown (5m)" : "Regenerate Key"}
                  </button>
                  <button
                    disabled={actionLoading?.id === key.id && actionLoading?.type === "revoke"}
                    className="text-xs px-2 py-1 rounded-sm border border-destructive/60 text-destructive hover:bg-destructive/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    onClick={() => handleRevokeKey(key.id)}
                  >
                    {actionLoading?.id === key.id && actionLoading?.type === "revoke" ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No API keys found.</div>
      )}

      <>
        <button
          onClick={handleGenerateSecretKey}
          disabled={generateMutation.isPending}
          className="flex items-center cursor-pointer gap-2 mt-3 text-xs px-3 py-2 rounded-sm border border-signal bg-signal text-signal-foreground hover:bg-signal/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-signal-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <>
              <Plus size={16} />
              Generate Secret Key
            </>
          )}
        </button>
      </>

      <SecretKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        secretKey={secretKey}
      />
    </div>
  );
}