import { Trash2, AlertTriangle, X } from "lucide-react";

export default function DeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card text-foreground rounded-sm shadow-lg border border-hairline relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 size={20} />
            <h2 className="font-display text-lg font-semibold">Delete Account</h2>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 text-sm text-muted-foreground">
          <p>
            Deleting your Videon account is a{" "}
            <strong className="text-foreground">permanent action</strong>. However,
            you will have <strong className="text-foreground">28 days</strong> to
            recover your account before it&apos;s permanently deleted.
          </p>

          <div className="flex items-start gap-2 text-destructive bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>
              <strong>Important:</strong> Once the account is fully deleted, you{" "}
              <strong>cannot</strong> use the same email to sign up again in the
              future.
            </p>
          </div>

          <p className="text-muted-foreground">
            You can <strong className="text-foreground">restore</strong> your account
            within <strong className="text-foreground">28 days</strong> from the date
            of deletion. After that, it will be{" "}
            <strong className="text-foreground">permanently removed</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 cursor-pointer py-1.5 rounded-sm text-sm bg-muted hover:bg-muted/80 text-foreground"
          >
            Cancel
          </button>
          <button className="px-4 py-1.5 cursor-pointer rounded-sm text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}