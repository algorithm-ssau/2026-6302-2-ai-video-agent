import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest-client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || !("seriesId" in body)) {
    return NextResponse.json({ error: "Series ID required" }, { status: 400 });
  }

  const { seriesId } = body as { seriesId: string };

  const supabase = supabaseAdmin();
  const { data: series, error: fetchError } = await supabase
    .from("video_agent_series")
    .select("id, status")
    .eq("id", seriesId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  if (series.status === "processing") {
    return NextResponse.json({ error: "Video already being generated" }, { status: 400 });
  }

  await supabase
    .from("video_agent_series")
    .update({ status: "processing" })
    .eq("id", seriesId);

  await inngest.send({
    name: "video/generate",
    data: {
      seriesId,
      userId,
    },
  });

  return NextResponse.json({ ok: true, message: "Video generation started" });
}