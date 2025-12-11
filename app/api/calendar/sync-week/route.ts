/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/calendar/sync-week/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

async function refreshTokens(refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Refresh failed: ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }>;
}

async function syncWeekEvents(
  supabase: any,
  userId: string,
  accessToken: string
) {
  const weekStart = dayjs().startOf("week").add(1, "day").startOf("day");
  const weekEnd = weekStart.add(7, "day");

  const params = new URLSearchParams({
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Google events error:", text);
    return;
  }

  const data = await res.json();
  const events = (data.items || []) as any[];

  for (const ev of events) {
    if (!ev.start || !ev.end) continue;

    const start = ev.start.dateTime || ev.start.date;
    const end = ev.end.dateTime || ev.end.date;
    if (!start || !end) continue;

    await supabase.from("calendar_events").upsert(
      {
        user_id: userId,
        provider: "google",
        external_id: ev.id,
        calendar_id: ev.organizer?.email ?? null,
        summary: ev.summary ?? null,
        start_time: start,
        end_time: end,
      },
      {
        onConflict: "user_id, provider, external_id",
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connection } = await supabase
    .from("calendar_connections")
    .select("access_token, refresh_token, expiry_date")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      { error: "No calendar connection" },
      { status: 400 }
    );
  }

  let accessToken = connection.access_token as string;

  // Refresh if expired or close to expiry
  if (
    connection.expiry_date &&
    dayjs(connection.expiry_date).isBefore(dayjs().add(1, "minute")) &&
    connection.refresh_token
  ) {
    try {
      const refreshed = await refreshTokens(connection.refresh_token);
      accessToken = refreshed.access_token;

      const newExpiry = dayjs()
        .add(refreshed.expires_in, "second")
        .toISOString();

      await supabase
        .from("calendar_connections")
        .update({
          access_token: accessToken,
          expiry_date: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "google");
    } catch (err) {
      console.error("Refresh error:", err);
    }
  }

  await syncWeekEvents(supabase, userId, accessToken);

  return NextResponse.json({ success: true });
}
