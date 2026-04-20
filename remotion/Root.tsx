"use client";

import { Composition } from "remotion";

import { REMOTION_COMPOSITION_ID } from "./constants";
import { VideoComposition } from "./VideoComposition";
import type { VideoCompositionProps } from "./types";

const DEFAULT_PROPS: VideoCompositionProps = {
  images: [],
  audioUrl: "",
  captionsWords: [],
  selectedCaptionStyle: "fade-up",
  fps: 30,
  width: 1080,
  height: 1920,
  durationInFrames: 300,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id={REMOTION_COMPOSITION_ID}
      component={VideoComposition}
      durationInFrames={DEFAULT_PROPS.durationInFrames}
      fps={DEFAULT_PROPS.fps}
      width={DEFAULT_PROPS.width}
      height={DEFAULT_PROPS.height}
      defaultProps={DEFAULT_PROPS}
    />
  );
};

