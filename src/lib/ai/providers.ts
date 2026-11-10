// Provider registry: one entry per AI capability. To connect a new (free or open-source) provider,
// add an adapter that implements the capability's interface below and flip its status to "connected".

export type Capability = "script" | "storyboard" | "image" | "video" | "voice";
export type ProviderStatus = "connected" | "not-connected";

export interface ProviderInfo {
  id: string;
  capability: Capability;
  name: string;
  description: string;
  status: ProviderStatus;
  /** Candidate providers that fit this slot later. */
  candidates: string[];
}

/** Contract a future voiceover provider must implement. */
export interface VoiceProviderAdapter {
  id: string;
  listVoices(language: "english" | "urdu"): Promise<{ id: string; label: string }[]>;
  synthesize(input: { text: string; voiceId: string; language: "english" | "urdu" }): Promise<Blob>;
}

/** Contract a future video generation provider must implement. */
export interface VideoProviderAdapter {
  id: string;
  generateClip(input: { prompt: string; aspectRatio: "9:16" | "1:1" | "16:9"; durationSec: number; imageBlob?: Blob }): Promise<Blob>;
}

/** Contract a future image generation provider must implement. */
export interface ImageProviderAdapter {
  id: string;
  generateImage(input: { prompt: string; aspectRatio: "9:16" | "1:1" | "16:9" }): Promise<Blob>;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "lovable-ai-text",
    capability: "script",
    name: "Lovable AI — Script writer",
    description: "Writes video scripts in English, Urdu and Roman Urdu.",
    status: "connected",
    candidates: [],
  },
  {
    id: "lovable-ai-storyboard",
    capability: "storyboard",
    name: "Lovable AI — Storyboard",
    description: "Splits scripts into scenes with image and video prompts.",
    status: "connected",
    candidates: [],
  },
  {
    id: "voice-slot",
    capability: "voice",
    name: "AI Voiceover",
    description: "Turn voiceover text into speech in Urdu and English.",
    status: "not-connected",
    candidates: ["Coqui XTTS (open source)", "Piper TTS (open source)", "ElevenLabs", "Google TTS"],
  },
  {
    id: "video-slot",
    capability: "video",
    name: "AI Video Generation",
    description: "Generate video clips from each scene's video prompt.",
    status: "not-connected",
    candidates: ["Stable Video Diffusion (open source)", "CogVideoX (open source)", "Runway", "Luma"],
  },
  {
    id: "image-slot",
    capability: "image",
    name: "AI Image Generation",
    description: "Generate stills from each scene's image prompt.",
    status: "not-connected",
    candidates: ["Stable Diffusion XL (open source)", "FLUX (open source)"],
  },
];

export function getProvider(capability: Capability) {
  return PROVIDERS.find((p) => p.capability === capability)!;
}

export function isConnected(capability: Capability) {
  return getProvider(capability).status === "connected";
}
