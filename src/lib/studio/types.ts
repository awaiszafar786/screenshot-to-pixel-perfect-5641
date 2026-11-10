export type ScriptLanguage = "english" | "urdu" | "roman-urdu";
export type VoiceLanguage = "english" | "urdu";
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type MediaKind = "image" | "video" | "audio";

export const LANGUAGE_LABELS: Record<ScriptLanguage, string> = {
  english: "English",
  urdu: "Urdu (اردو)",
  "roman-urdu": "Roman Urdu",
};

export const ASPECT_RATIOS: { value: AspectRatio; label: string; hint: string }[] = [
  { value: "9:16", label: "Vertical", hint: "Reels · Shorts · TikTok" },
  { value: "1:1", label: "Square", hint: "Feed posts" },
  { value: "16:9", label: "Landscape", hint: "YouTube · Web" },
];

export const VIDEO_STYLES = [
  "Cinematic",
  "Educational",
  "Storytelling",
  "Motivational",
  "Documentary",
  "Product promo",
  "News explainer",
  "Comedy",
  "Islamic / spiritual",
  "Vlog",
] as const;

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180] as const;

export interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  createdAt: number;
}

export interface Scene {
  id: string;
  title: string;
  narration: string;
  subtitle: string;
  visual: string;
  imagePrompt: string;
  videoPrompt: string;
  durationSec: number;
  mediaId: string | null;
}

export interface ScriptDraft {
  topic: string;
  audience: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

export interface VoiceoverState {
  language: VoiceLanguage;
  text: string;
  audioMediaId: string | null;
  providerId: string | null;
}

export interface ExportSettings {
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30 | 60;
  format: "mp4" | "webm";
  burnSubtitles: boolean;
  includeVoiceover: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  language: ScriptLanguage;
  style: string;
  durationSec: number;
  aspectRatio: AspectRatio;
  script: ScriptDraft;
  scenes: Scene[];
  media: MediaItem[];
  voiceover: VoiceoverState;
  exportSettings: ExportSettings;
  createdAt: number;
  updatedAt: number;
}
