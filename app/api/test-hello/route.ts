import { inngest } from "@/lib/inngest-client";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await inngest.send({
    name: "test/hello.world",
    data: { name: "Test User" },
  });
  return NextResponse.json({ success: true, result });
}