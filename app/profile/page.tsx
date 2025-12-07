// app/profile/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProfileClient from "./_client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      user_id,
      email,
      display_name,
      bio,
      timezone,
      weekly_focus,
      notifications_enabled,
      weekly_summary_day,
      accountability_partner_email
      `
    )
    .eq("user_id", userId)
    .maybeSingle();

  const initialProfile = {
    email: profile?.email ?? "",
    display_name: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    timezone: profile?.timezone ?? "",
    weekly_focus: profile?.weekly_focus ?? "",
    notifications_enabled: profile?.notifications_enabled ?? true,
    weekly_summary_day: profile?.weekly_summary_day ?? "Monday",
    accountability_partner_email: profile?.accountability_partner_email ?? "",
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Profile</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Update your personal details, weekly focus, and accountability settings.
      </p>
      <ProfileClient initialProfile={initialProfile} />
    </div>
  );
}
