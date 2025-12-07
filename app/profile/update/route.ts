/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const profileUpdate = {
      user_id: userId,
      email: body.email ?? null,
      display_name: body.display_name ?? null,
      bio: body.bio ?? null,
      timezone: body.timezone ?? null,
      weekly_focus: body.weekly_focus ?? null,
      notifications_enabled: body.notifications_enabled ?? true,
      weekly_summary_day: body.weekly_summary_day ?? "Monday",
      accountability_partner_email: body.accountability_partner_email ?? null,
    };

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(profileUpdate, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Profile upsert error:", upsertError);
      return NextResponse.json(
        { error: "Could not save profile" },
        { status: 500 }
      );
    }

    // Also try to sync display_name to Clerk
    try {
      const user = await currentUser();
      if (user && profileUpdate.display_name) {
        // Update user metadata in Clerk via the backend API
        const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.CLERK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: profileUpdate.display_name,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to update Clerk user");
        }
      }
    } catch (clerkError) {
      console.warn("Could not sync profile name to Clerk:", clerkError);
      // Don't fail the entire request for this
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Profile API error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
