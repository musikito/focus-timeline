// import { auth } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabase";

// export async function POST() {
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   await supabase
//     .from("profiles")
//     .update({ has_completed_walkthrough: true })
//     .eq("user_id", userId);

//   return NextResponse.json({ ok: true });
// }
// import { NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { supabase } from "@/lib/supabase";

// export async function POST() {
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const { error } = await supabase
//     .from("profiles")
//     .update({ has_completed_walkthrough: true })
//     .eq("user_id", userId);

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
//   return NextResponse.json({ ok: true });
// }
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("profiles")
    .update({ has_completed_walkthrough: true })
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
