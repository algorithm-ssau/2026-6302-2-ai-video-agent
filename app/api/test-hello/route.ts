import { inngest } from "@/lib/inngest-client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await inngest.send({
      name: "test/hello.world",
      data: { name: "Test User" },
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to send test Inngest event:", error);
    return NextResponse.json({ error: "Failed to send test event" }, { status: 500 });
  }
}
