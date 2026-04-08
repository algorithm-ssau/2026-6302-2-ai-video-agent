import { eventType } from "inngest";
import { serve } from "inngest/next";
import { inngest } from "./inngest-client";
import { generateVideoScriptStep } from "./video-steps/generate-script";

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
  async ({ event, step }) => {
    const { seriesId, userId } = event.data;

    const scriptData = await step.run("generate-video-script", async () => {
      console.log("Generating video script for series:", seriesId);
      return await generateVideoScriptStep(seriesId, userId);
    });

    await step.run("generate-voice", async () => {
      console.log("Generating voice using TTS (placeholder)");
      return { success: true };
    });

    await step.run("generate-caption", async () => {
      console.log("Generating captions (placeholder)");
      return { success: true };
    });

    await step.run("generate-images", async () => {
      console.log("Generating images (placeholder)");
      return { success: true };
    });

    await step.run("save-to-database", async () => {
      console.log("Saving video data to database (placeholder)");
      return { success: true };
    });

    await step.run("update-series-status", async () => {
      console.log("Updating series status (placeholder)");
      return { success: true };
    });

    return {
      success: true,
      seriesId,
      scriptTitle: scriptData.title,
      sceneCount: scriptData.scenes.length,
    };
  }
);

export default serve({
  client: inngest,
  functions: [helloWorld, generateVideo],
});
