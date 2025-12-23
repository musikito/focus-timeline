import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { weeklyInsightEmail } from "@/lib/emails/weekly-insight";
import { clerkClient } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch user email + preference
  // const { data: profile } = await supabase
  //   .from("profiles")
  //   .select("email, display_name, weekly_email_enabled")
  //   .eq("user_id", userId)
  //   .maybeSingle();

  // if (!profile?.email) {
  //   return NextResponse.json({ error: "No email on file" }, { status: 400 });
  // }
  // if (profile.weekly_email_enabled === false) {
  //   return NextResponse.json({ skipped: true });
  // }

  // Fetch profile
let { data: profile } = await supabase
  .from("profiles")
  .select("email, display_name, weekly_email_enabled")
  .eq("user_id", userId)
  .maybeSingle();

// If email missing, hydrate from Clerk
if (!profile?.email) {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const clerkEmail =
    user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user.emailAddresses?.[0]?.emailAddress ??
    null;

  if (!clerkEmail) {
    return NextResponse.json(
      { error: "No email available from Clerk" },
      { status: 400 }
    );
  }

  // Update profile with Clerk email
  const { data: updated } = await supabase
    .from("profiles")
    .update({ email: clerkEmail })
    .eq("user_id", userId)
    .select("email, display_name, weekly_email_enabled")
    .single();

  profile = updated;
}

if (!profile) {
  return NextResponse.json(
    { error: "No profile available" },
    { status: 400 }
  );
}

  // Fetch insight
  let { data: insight } = await supabase
    .from("weekly_insights")
    .select("summary, suggestions, infographic_svg, week_start_date")
    .eq("user_id", userId)
    .eq("week_start_date", weekStart)
    .maybeSingle();

  // if (!insight) {
  //   return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  // }
  if (!insight) {
  // Generate insight on-demand
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/weekly-insight?weekStart=${weekStart}`,
    { headers: { Cookie: req.headers.get("cookie") ?? "" } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to generate weekly insight" },
      { status: 500 }
    );
  }

  const generated = await res.json();

  insight = {
    summary: generated.summary,
    suggestions: generated.suggestions,
    infographic_svg: generated.infographicSvg,
    week_start_date: weekStart,
  };
}

  const weekLabel = `${dayjs(weekStart).format("MMM D")} – ${dayjs(weekStart)
    .add(6, "day")
    .format("MMM D")}`;

  const email = weeklyInsightEmail({
    userName: profile.display_name ?? undefined,
    weekLabel,
    summaryMarkdown: insight.summary,
    suggestions: insight.suggestions,
    infographicSvg: insight.infographic_svg,
  });

  // const res = await resend.emails.send({
  //   from: process.env.EMAIL_FROM!,
  //   to: profile.email,
  //   subject: email.subject,
  //   html: email.html,
  // });
  const sendResult = await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: profile.email,
  subject: email.subject,
  html: email.html,
});

console.log("RESEND RESULT:", sendResult);


  return NextResponse.json({ ok: true, id: sendResult.data?.id });
}
