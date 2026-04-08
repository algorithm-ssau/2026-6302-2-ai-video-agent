import { eventType } from "inngest";
import { serve } from "inngest/next";
import { inngest } from "./inngest-client";

const helloWorldEvent = eventType("test/hello.world");
const videoGenerateEvent = eventType("video/generate");

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    name: "Hello World",
    triggers: [helloWorldEvent],
  },
  async ({ event }) => {
    return { message: `Hello, ${event.data?.name || "World"}!` };
  }
);

export const generateVideo = inngest.createFunction(
  {
    id: "generate-video",
    name: "Generate Video",
    triggers: [videoGenerateEvent],
  },
  async ({ event }) => {
    const { scriptId, voiceId } = event.data;
    return { message: `Generating video for script ${scriptId} with voice ${voiceId}` };
  }
);

export default serve({
  client: inngest,
  functions: [helloWorld, generateVideo],
});