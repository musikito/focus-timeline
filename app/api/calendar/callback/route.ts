/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/calendar/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

async function fetchTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`;

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  return res.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token?: string;
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

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl.origin));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/timeline?error=no_code", req.nextUrl.origin));
  }

  try {
    const tokens = await fetchTokens(code);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiryDate = dayjs()
      .add(tokens.expires_in, "second")
      .toISOString();

    // Upsert connection
    await supabase.from("calendar_connections").upsert(
      {
        user_id: userId,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, provider" }
    );

    // Initial sync for this week
    await syncWeekEvents(supabase, userId, tokens.access_token);

    return NextResponse.redirect(new URL("/timeline?calendar=connected", req.nextUrl.origin));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      new URL("/timeline?calendar=error", req.nextUrl.origin)
    );
  }
}
