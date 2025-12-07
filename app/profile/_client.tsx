/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

type ProfileForm = {
  email: string;
  display_name: string;
  bio: string;
  timezone: string;
  weekly_focus: string;
  notifications_enabled: boolean;
  weekly_summary_day: string;
  accountability_partner_email: string;
};

export default function ProfileClient({
  initialProfile,
}: {
  initialProfile: ProfileForm;
}) {
  const [form, setForm] = useState<ProfileForm>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to save profile");
      }

      setMessage("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Basic information</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Display name</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            placeholder="How should we call you?"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Email (for summaries)
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm min-h-[80px]"
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Tell us a bit about what you're focusing on this season."
          />
        </div>
      </section>

      {/* Focus / Timezone */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Weekly focus & timezone</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Weekly focus theme</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.weekly_focus}
            onChange={(e) => update("weekly_focus", e.target.value)}
            placeholder="e.g. Deep work, health, shipping v1..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Timezone</label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            placeholder="e.g. America/New_York"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Used to align your weekly timeline & summaries.
          </p>
        </div>
      </section>

      {/* Notifications & Accountability */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">Notifications & accountability</h2>

        <div className="flex items-center gap-2">
          <input
            id="notifications_enabled"
            type="checkbox"
            className="h-4 w-4"
            checked={form.notifications_enabled}
            onChange={(e) => update("notifications_enabled", e.target.checked)}
          />
          <label
            htmlFor="notifications_enabled"
            className="text-sm font-medium"
          >
            Send me a weekly summary email
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Day to send weekly summary
          </label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.weekly_summary_day}
            onChange={(e) => update("weekly_summary_day", e.target.value)}
          >
            <option>Sunday</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
            <option>Saturday</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Accountability partner email
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-900 text-sm"
            value={form.accountability_partner_email}
            onChange={(e) =>
              update("accountability_partner_email", e.target.value)
            }
            placeholder="friend/coach you want to share summaries with"
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-500">{message}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
