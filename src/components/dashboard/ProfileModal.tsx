"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Hash,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Save,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import type { User } from "../../app/auth/authSlice";
import { dashboardService } from "../../services/dashboardService";
import type { StudentProfile } from "../../types/dashboard";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onProfileSynced?: (profile: StudentProfile) => void;
  user: User | null;
  displayName: string;
  initials: string;
  roleLabel: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatDateTime = (value?: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const extractApiError = (err: unknown, fallback: string): string => {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) return data.message;
      if (typeof data.error === "string" && data.error.trim()) return data.error;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

export default function ProfileModal({
  isOpen,
  onClose,
  onLogout,
  onProfileSynced,
  user,
  displayName,
  initials,
  roleLabel,
}: ProfileModalProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setError(null);
    setSuccessMsg(null);
    setIsEditing(false);

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const fetched = await dashboardService.getProfile();
        if (cancelled) return;
        setProfile(fetched);
        setUsernameInput(fetched.username ?? "");
        setNameInput(fetched.name ?? "");
        setEmailInput(fetched.email ?? "");
        onProfileSynced?.(fetched);
      } catch (err) {
        if (cancelled) return;
        setError(extractApiError(err, "Failed to load profile details."));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeName =
    profile?.name ||
    profile?.username ||
    (user?.fullName as string | undefined) ||
    (user?.name as string | undefined) ||
    displayName;

  const activeInitials =
    activeName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || initials;

  const activeRole = profile?.role || roleLabel;

  const handleStartEdit = () => {
    setError(null);
    setSuccessMsg(null);
    setUsernameInput(profile?.username ?? (user?.username as string) ?? "");
    setNameInput(profile?.name ?? (user?.name as string) ?? (user?.fullName as string) ?? "");
    setEmailInput(profile?.email ?? (user?.email as string) ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setError(null);
    setUsernameInput(profile?.username ?? "");
    setNameInput(profile?.name ?? "");
    setEmailInput(profile?.email ?? "");
    setIsEditing(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedUsername = usernameInput.trim();
    const trimmedName = nameInput.trim();
    const trimmedEmail = emailInput.trim();

    if (!trimmedUsername) {
      setError("Username cannot be empty.");
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const payload: { username?: string; name?: string; email?: string } = {
      username: trimmedUsername,
      name: trimmedName,
    };
    if (trimmedEmail) {
      payload.email = trimmedEmail;
    }

    setIsSaving(true);
    try {
      const updated = await dashboardService.updateProfile(payload);
      setProfile(updated);
      setUsernameInput(updated.username ?? "");
      setNameInput(updated.name ?? "");
      setEmailInput(updated.email ?? "");
      setIsEditing(false);
      setSuccessMsg("Profile updated successfully.");
      onProfileSynced?.(updated);
    } catch (err) {
      setError(extractApiError(err, "Failed to update profile."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold text-white ring-2 ring-white/30">
              {activeInitials}
            </div>
            <div className="min-w-0">
              <h2 id="profile-modal-title" className="truncate text-lg font-bold">
                {activeName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                  {activeRole.toLowerCase()}
                </span>
                {profile?.status && (
                  <span className="inline-block rounded-full bg-emerald-400/25 px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                    {profile.status.toLowerCase()}
                  </span>
                )}
                {profile?.subscription_status && (
                  <span className="inline-block rounded-full bg-amber-400/25 px-2.5 py-0.5 text-[11px] font-semibold capitalize">
                    {profile.subscription_status.replace(/_/g, " ").toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-600 mb-2" />
              <span className="text-xs font-medium">Loading profile...</span>
            </div>
          ) : isEditing ? (
            <form id="profile-edit-form" onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={UserIcon}
                  label="Full Name"
                  value={profile?.name || (user?.fullName as string) || (user?.name as string) || "—"}
                />
                <InfoRow
                  icon={UserIcon}
                  label="Username"
                  value={profile?.username || (user?.username as string) || "—"}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={profile?.email || (user?.email as string) || "—"}
                />
                <InfoRow icon={Phone} label="Phone" value={profile?.phone || "—"} />
                <InfoRow
                  icon={Shield}
                  label="Role"
                  value={activeRole.toLowerCase()}
                  capitalize
                />
                <InfoRow
                  icon={Hash}
                  label="User ID"
                  value={
                    profile?.id !== undefined && profile?.id !== ""
                      ? String(profile.id)
                      : user?.id !== undefined
                        ? String(user.id)
                        : "—"
                  }
                />
              </div>
              <InfoRow
                icon={Calendar}
                label="Joined"
                value={formatDateTime(profile?.created_at)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize = false,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-slate-500">{label}</div>
        <div
          className={`truncate text-sm font-semibold text-slate-900 ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
