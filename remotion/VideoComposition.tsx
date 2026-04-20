"use client";

import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { chunkCaptionWords } from "../lib/remotion/captions";
import type { CaptionStyleId, VideoCompositionProps } from "./types";

const TRANSITIONS = ["fade", "zoom", "slide-up", "slide-down"] as const;

function isKnownStyle(style: string | null | undefined): style is CaptionStyleId {
  return (
    style === "fade-up" ||
    style === "typewriter" ||
    style === "slide-left" ||
    style === "pulse" ||
    style === "bounce" ||
    style === "glow"
  );
}

function captionStyleClass(selected: string | null | undefined): CaptionStyleId {
  return isKnownStyle(selected) ? selected : "fade-up";
}

function getCaptionStyle(style: CaptionStyleId, frame: number, fps: number): React.CSSProperties {
  const t = frame / fps;
  if (style === "typewriter") {
    const reveal = Math.max(0.2, Math.sin(t * Math.PI) * 0.5 + 0.5);
    return {
      borderRight: "3px solid rgba(255,255,255,0.9)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      maxWidth: `${Math.max(25, Math.round(reveal * 100))}%`,
    };
  }
  if (style === "slide-left") {
    return {
      transform: `translateX(${Math.max(0, 32 - frame * 1.2)}px)`,
    };
  }
  if (style === "pulse") {
    return {
      transform: `scale(${1 + Math.sin(t * 8) * 0.02})`,
    };
  }
  if (style === "bounce") {
    return {
      transform: `translateY(${Math.sin(t * 9) * -6}px)`,
    };
  }
  if (style === "glow") {
    return {
      textShadow: "0 0 8px rgba(255,255,255,0.55), 0 0 18px rgba(168,85,247,0.9)",
    };
  }
  return {
    transform: `translateY(${Math.max(0, 16 - frame)}px)`,
    opacity: Math.min(1, frame / 8),
  };
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  images,
  audioUrl,
  captionsWords,
  selectedCaptionStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const safeImages = images.length > 0 ? images : ["/logo.png"];
  const framesPerScene = Math.max(1, Math.floor(durationInFrames / safeImages.length));
  const chunks = chunkCaptionWords(captionsWords, fps);
  const activeCaption = chunks.find((c) => frame >= c.startFrame && frame < c.endFrame) ?? null;
  const captionStyle = captionStyleClass(selectedCaptionStyle);

  return (
    <AbsoluteFill style={{ backgroundColor: "#05050b" }}>
      {safeImages.map((image, index) => {
        const sceneStart = index * framesPerScene;
        const sceneEnd =
          index === safeImages.length - 1 ? durationInFrames : (index + 1) * framesPerScene;
        const localFrame = frame - sceneStart;
        const inScene = frame >= sceneStart && frame < sceneEnd;
        if (!inScene) return null;

        const transition = TRANSITIONS[index % TRANSITIONS.length];
        const fadeIn = interpolate(localFrame, [0, 15], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const zoom = 1 + interpolate(localFrame, [0, framesPerScene], [0, 0.08], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const springValue = spring({
          frame: localFrame,
          fps,
          config: { damping: 200, stiffness: 110 },
        });
        const translateY = interpolate(springValue, [0, 1], [40, 0]);
        const translateYDown = interpolate(springValue, [0, 1], [-40, 0]);

        const transform =
          transition === "zoom"
            ? `scale(${zoom})`
            : transition === "slide-up"
              ? `translateY(${translateY}px) scale(1.02)`
              : transition === "slide-down"
                ? `translateY(${translateYDown}px) scale(1.02)`
                : "scale(1)";

        return (
          <AbsoluteFill key={`${image}-${index}`} style={{ opacity: fadeIn }}>
            <Img
              src={image}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform,
              }}
            />
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.7) 100%)",
              }}
            />
          </AbsoluteFill>
        );
      })}

      {audioUrl ? <Audio src={audioUrl} /> : null}

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: 48 }}>
        {activeCaption ? (
          <div
            style={{
              maxWidth: "85%",
              textAlign: "center",
              color: "#fff",
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: 0.4,
              textShadow: "0 4px 12px rgba(0,0,0,0.75)",
              padding: "14px 20px",
              ...getCaptionStyle(captionStyle, frame, fps),
            }}
          >
            {activeCaption.text}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

