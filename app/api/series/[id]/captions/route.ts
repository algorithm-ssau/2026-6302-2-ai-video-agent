import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from("video_agent_series")
    .select("step_payload")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stepPayload = data?.step_payload as Record<string, unknown> | null;
  const words = Array.isArray(stepPayload?.captions_words) ? stepPayload?.captions_words : [];

  return NextResponse.json({ words });
}
