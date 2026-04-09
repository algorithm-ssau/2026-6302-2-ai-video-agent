import Groq from "groq-sdk";

export interface VideoScene {
  sceneNumber: number;
  text: string;
  imagePrompt: string;
  duration: number;
}

export interface VideoScript {
  title: string;
  scenes: VideoScene[];
  totalDuration: number;
  language: string;
}

export async function generateVideoScript(seriesData: {
  seriesName: string;
  niche: string;
  language: string;
  duration: string;
  style: string;
}): Promise<VideoScript> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === "your-groq-api-key-here") {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const client = new Groq({ apiKey });

  const durationSeconds = seriesData.duration === "30-40" ? 35 : 65;
  const imageCount = seriesData.duration === "30-40" ? 4 : 6;

  const prompt = `You are a professional video script writer. Generate a natural, conversational video script for a ${seriesData.duration} second video.

SERIES INFO:
- Series Name: ${seriesData.seriesName}
- Niche/Topic: ${seriesData.niche}
- Language: ${seriesData.language}
- Video Style: ${seriesData.style}

REQUIREMENTS:
1. Generate exactly ${imageCount} scenes for this ${durationSeconds} second video
2. Each scene should be ${Math.round(durationSeconds / imageCount)}-${Math.round(durationSeconds / imageCount) + 2} seconds
3. Write natural, conversational text suitable for voiceover (not robotic or overly formal)
4. Each scene MUST have:
   - sceneNumber: Scene number (1-${imageCount})
   - text: Natural conversational text for voiceover (${seriesData.language})
   - imagePrompt: Detailed image generation prompt describing what to show in the scene (in English, for AI image generation)
   - duration: Duration in seconds for this scene

IMPORTANT: Return ONLY valid JSON, no raw text. Use this exact JSON structure:
{
  "title": "Video title here",
  "scenes": [
    {
      "sceneNumber": 1,
      "text": "Conversational voiceover text here",
      "imagePrompt": "Detailed image prompt for AI generation",
      "duration": 8
    }
  ],
  "totalDuration": ${durationSeconds},
  "language": "${seriesData.language}"
}`;

  const result = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const responseText = result.choices[0]?.message?.content || "";

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  let parsedScript: VideoScript;
  try {
    parsedScript = JSON.parse(jsonMatch[0]) as VideoScript;
  } catch (parseError) {
    throw new Error(
      `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}. Response snippet: ${responseText.slice(0, 200)}`
    );
  }

  if (typeof parsedScript.title !== "string" || !parsedScript.title) {
    throw new Error("Invalid script format: missing or invalid title");
  }

  if (typeof parsedScript.totalDuration !== "number") {
    throw new Error("Invalid script format: missing or invalid totalDuration");
  }

  if (!parsedScript.scenes || !Array.isArray(parsedScript.scenes)) {
    throw new Error("Invalid script format: missing scenes array");
  }

  for (const scene of parsedScript.scenes) {
    if (
      typeof scene.sceneNumber !== "number" ||
      typeof scene.text !== "string" ||
      typeof scene.imagePrompt !== "string" ||
      typeof scene.duration !== "number"
    ) {
      throw new Error(
        `Invalid script format: scene ${scene.sceneNumber ?? "unknown"} is missing required fields`
      );
    }
  }

  return parsedScript;
}
