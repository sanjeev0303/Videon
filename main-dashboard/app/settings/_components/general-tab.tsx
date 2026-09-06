import React, { useState } from "react";
import { ChevronRight, ChevronDown, Trash2, AlertTriangle, Activity, Mail } from "lucide-react";
import DeleteAccountModal from "@/components/modals/delete-account.modal";

interface GeneralTabProps {
  userEmail?: string;
}

export default function GeneralTab({ userEmail }: GeneralTabProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [usageThreshold, setUsageThreshold] = useState(80);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleDropdown = (key: string) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <>
      {/* Plan Usage Alert */}
      <div className="md:w-[60%]">
        <div className="flex items-center justify-between px-3 pb-1">
          <div className="flex items-start gap-3">
            <Activity size={22} className="text-signal mt-1" />
            <div>
              <div className="text-base font-medium">
                Plan Usage Alert
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Get notified when usage exceeds your set threshold
                (default: 80%).
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleDropdown("usage")}
            className="w-7 h-7 flex items-center justify-center rounded-sm border border-hairline hover:bg-muted transition cursor-pointer"
          >
            {openDropdown === "usage" ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>

        {openDropdown === "usage" && (
          <div className="px-5 py-3">
            <label className="text-sm mb-1 block">
              Alert Threshold (%):
            </label>
            <input
              type="number"
              min={20}
              max={80}
              value={usageThreshold}
              onChange={(e) =>
                setUsageThreshold(parseInt(e.target.value))
              }
              className="w-24 px-2 py-1 rounded-sm border border-input bg-muted/40 text-foreground font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be between 20% and 80%.
            </p>
          </div>
        )}
      </div>

      {/* Video Upload Email Alert */}
      <div className="md:w-[60%]">
        <div className="flex items-center justify-between px-3 pb-1">
          <div className="flex items-start gap-3">
            <Mail size={22} className="text-signal mt-1" />
            <div>
              <div className="text-base font-medium">
                Upload Completion Email
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Email{" "}
                <span className="font-medium text-signal">
                  {userEmail}
                </span>{" "}
                when a video processing is completed.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleDropdown("upload")}
            className="w-7 h-7 flex items-center justify-center rounded-sm border border-hairline hover:bg-muted transition cursor-pointer"
          >
            {openDropdown === "upload" ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        </div>

        {openDropdown === "upload" && (
          <div className="px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Email notifications:
            </span>
            <button
              onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
              className={`w-10 h-5 rounded-full relative transition ${
                emailAlertsEnabled
                  ? "bg-signal"
                  : "bg-muted-foreground/40"
              }`}
            >
              <span
                className={`absolute w-4 h-4 bg-white rounded-full top-0.5 transition ${
                  emailAlertsEnabled ? "left-5" : "left-1"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-4 md:w-[60%] border-t border-hairline">
        <h3 className="text-xl text-destructive font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={22} className="text-destructive" />
          Danger Zone
        </h3>
        <div
          className="flex items-center justify-between p-3 hover:bg-muted/40 rounded-sm cursor-pointer transition"
          onClick={() => setShowDeleteModal(true)}
        >
          <div className="flex items-start gap-3">
            <Trash2 size={22} className="mt-1" />
            <div>
              <div className="text-base font-medium">Delete Account</div>
              <p className="text-sm text-destructive/80 mt-0.5">
                Permanently delete your Videon account. This action cannot
                be undone.
              </p>
            </div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-sm border border-destructive/50 text-destructive hover:bg-destructive/10 transition cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
}