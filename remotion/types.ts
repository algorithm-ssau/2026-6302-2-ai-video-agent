export type CaptionWord = {
  word: string;
  start: number;
  end: number;
  confidence?: number;
};

export type CaptionStyleId =
  | "fade-up"
  | "typewriter"
  | "slide-left"
  | "pulse"
  | "bounce"
  | "glow";

export type VideoCompositionProps = {
  images: string[];
  audioUrl: string;
  captionsWords: CaptionWord[];
  selectedCaptionStyle?: string | null;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
};
