import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest-client";
import { helloWorld, generateVideo } from "@/lib/inngest";

export const dynamic = "force-dynamic";

const handler = serve({
  client: inngest,
  functions: [helloWorld, generateVideo],
});

export { handler as GET, handler as POST, handler as PUT };