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
            <Activity size={22} className="text-purple-500 mt-1" />
            <div>
              <div className="text-base font-medium">
                Plan Usage Alert
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Get notified when usage exceeds your set threshold
                (default: 80%).
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleDropdown("usage")}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
              className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Must be between 20% and 80%.
            </p>
          </div>
        )}
      </div>

      {/* Video Upload Email Alert */}
      <div className="md:w-[60%]">
        <div className="flex items-center justify-between px-3 pb-1">
          <div className="flex items-start gap-3">
            <Mail size={22} className="text-green-500 mt-1" />
            <div>
              <div className="text-base font-medium">
                Upload Completion Email
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Email{" "}
                <span className="font-medium text-indigo-500">
                  {userEmail}
                </span>{" "}
                when a video processing is completed.
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleDropdown("upload")}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
            <span className="text-sm text-gray-500 dark:text-gray-300">
              Email notifications:
            </span>
            <button
              onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}
              className={`w-10 h-5 rounded-full relative transition ${
                emailAlertsEnabled
                  ? "bg-green-500"
                  : "bg-gray-400 dark:bg-gray-600"
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
      <div className="pt-4 md:w-[60%] border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-xl text-red-500 font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-500" />
          Danger Zone
        </h3>
        <div
          className="flex items-center justify-between p-3"
          onClick={() => setShowDeleteModal(true)}
        >
          <div className="flex items-start gap-3">
            <Trash2 size={22} className="mt-1" />
            <div>
              <div className="text-base font-medium">Delete Account</div>
              <p className="text-sm text-red-400 mt-0.5">
                Permanently delete your Videon account. This action cannot
                be undone.
              </p>
            </div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-full border border-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition cursor-pointer">
            <ChevronRight size={16} className="text-red-400" />
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
