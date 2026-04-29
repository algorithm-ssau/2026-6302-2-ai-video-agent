import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest-client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || !("seriesId" in body)) {
      return NextResponse.json({ error: "Series ID required" }, { status: 400 });
    }

    const { seriesId } = body as { seriesId: unknown };

    if (typeof seriesId !== "string" || seriesId.trim().length === 0) {
      return NextResponse.json({ error: "Series ID must be a non-empty string" }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: series, error: fetchError } = await supabase
      .from("video_agent_series")
      .select("id, status")
      .eq("id", seriesId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !series) {
      console.error("Failed to load series before video generation:", fetchError);
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    if (series.status === "processing") {
      return NextResponse.json({ error: "Video already being generated" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("video_agent_series")
      .update({ status: "processing" })
      .eq("id", seriesId);

    if (updateError) {
      console.error("Failed to mark series as processing:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await inngest.send({
      name: "video/generate",
      data: {
        seriesId,
        userId,
      },
    });

    return NextResponse.json({ ok: true, message: "Video generation started" });
  } catch (error) {
    console.error("Unexpected error in POST /api/video-generate:", error);
    return NextResponse.json({ error: "Failed to start video generation" }, { status: 500 });
  }
}
