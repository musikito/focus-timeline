import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

export async function GET() {
  // Protect this route with a secret header in production
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const weekStart = dayjs().startOf("week").add(1, "day").format("YYYY-MM-DD");

  const { data: users } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("weekly_email_enabled", true);

  for (const u of users ?? []) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send-weekly-insight`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
  }

  return NextResponse.json({ sent: users?.length ?? 0 });
}
