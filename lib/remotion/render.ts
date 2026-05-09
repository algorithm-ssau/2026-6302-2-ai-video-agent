import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { getDurationFromCaptionWords } from "@/lib/remotion/captions";
import { REMOTION_COMPOSITION_ID } from "@/remotion/constants";
import type { CaptionWord, VideoCompositionProps } from "@/remotion/types";

type RenderInput = {
  seriesId: string;
  images: string[];
  audioUrl: string;
  captionsWords: CaptionWord[];
  selectedCaptionStyle: string | null;
};

let serveUrlPromise: Promise<string> | null = null;

async function getServeUrl() {
  if (!serveUrlPromise) {
    serveUrlPromise = bundle({
      entryPoint: path.resolve(process.cwd(), "remotion/index.ts"),
      webpackOverride: (config) => config,
    });
  }
  return serveUrlPromise;
}

export async function renderSeriesMp4(input: RenderInput): Promise<{ outputPath: string }> {
  const fps = 30;
  // Reduced resolution to save memory on low-RAM hosts (1GB servers)
  const width = 720;
  const height = 1280;
  const durationInFrames = Math.ceil(getDurationFromCaptionWords(input.captionsWords) * fps);

  const props: VideoCompositionProps = {
    images: input.images,
    audioUrl: input.audioUrl,
    captionsWords: input.captionsWords,
    selectedCaptionStyle: input.selectedCaptionStyle,
    fps,
    width,
    height,
    durationInFrames,
  };

  const serveUrl = await getServeUrl();
  const composition = await selectComposition({
    serveUrl,
    id: REMOTION_COMPOSITION_ID,
    inputProps: props,
  });

  const outDir = path.resolve(process.cwd(), ".tmp", "renders");
  await mkdir(outDir, { recursive: true });
  const outputPath = path.join(outDir, `series-${input.seriesId}-${Date.now()}.mp4`);

  await renderMedia({
    codec: "h264",
    composition: {
      ...composition,
      durationInFrames,
      fps,
      width,
      height,
    },
    serveUrl,
    outputLocation: outputPath,
    inputProps: props,
    imageFormat: "jpeg",
    audioCodec: "aac",
    x264Preset: "ultrafast",
    crf: 28,
    disallowParallelEncoding: true,
    offthreadVideoThreads: 1,
    concurrency: 1,
  });

  return { outputPath };
}

