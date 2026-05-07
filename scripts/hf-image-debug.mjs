#!/usr/bin/env node
import fs from "fs";
import { InferenceClient } from "@huggingface/inference";

const hfKey = process.env.HUGGING_FACE_API_KEY;
if (!hfKey) {
  console.error("Missing env: HUGGING_FACE_API_KEY");
  process.exit(1);
}

const promptArg = process.argv.slice(2).join(" ");
const prompt = promptArg || process.env.TEST_PROMPT || "A high-quality photograph of a futuristic city skyline at sunset";

const models = ["black-forest-labs/FLUX.1-schnell", "stabilityai/stable-diffusion-xl-base-1.0"];

async function run() {
  const client = new InferenceClient(hfKey);

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await client.textToImage({ model, inputs: prompt, parameters: { guidance_scale: 3.5 } });
      if (!response || typeof response.arrayBuffer !== "function") {
        console.warn(`${model}: no valid response object`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        console.warn(`${model}: empty buffer returned`);
        continue;
      }
      const buffer = Buffer.from(arrayBuffer);
      const out = `hf_debug_${model.replace(/[\\/:]/g, "_")}.png`;
      fs.writeFileSync(out, buffer);
      console.log(`${model}: wrote ${out} (${buffer.length} bytes)`);
      return;
    } catch (e) {
      console.error(`${model}: error`, e instanceof Error ? e.message : String(e));
      continue;
    }
  }
  console.error("All models failed");
}

run().catch((e) => {
  console.error("Unhandled error:", e);
  process.exit(1);
});
