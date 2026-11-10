import type { Project, Scene } from "./types";

export function uid(prefix = "id") {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function createScene(partial: Partial<Scene> = {}): Scene {
  return {
    title: "New scene",
    narration: "",
    subtitle: "",
    visual: "",
    imagePrompt: "",
    videoPrompt: "",
    durationSec: 5,
    mediaId: null,
    ...partial,
    id: partial.id || uid("scn"),
  };
}

export function createProject(input: Partial<Pick<Project, "name" | "description" | "language" | "aspectRatio" | "style" | "durationSec">> = {}): Project {
  const now = Date.now();
  return {
    id: uid("prj"),
    name: input.name?.trim() || "Untitled project",
    description: input.description?.trim() ?? "",
    language: input.language ?? "english",
    style: input.style ?? "Cinematic",
    durationSec: input.durationSec ?? 60,
    aspectRatio: input.aspectRatio ?? "9:16",
    script: { topic: "", audience: "", title: "", hook: "", body: "", cta: "", hashtags: [] },
    scenes: [],
    media: [],
    voiceover: { language: input.language === "english" ? "english" : "urdu", text: "", audioMediaId: null, providerId: null },
    exportSettings: { resolution: "1080p", fps: 30, format: "mp4", burnSubtitles: true, includeVoiceover: true },
    createdAt: now,
    updatedAt: now,
  };
}

/** Fill any fields missing from older saved or imported projects. */
export function normalizeProject(raw: Partial<Project> & { id?: string }): Project {
  const base = createProject(raw.name ? { name: raw.name } : {});
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    script: { ...base.script, ...(raw.script ?? {}) },
    voiceover: { ...base.voiceover, ...(raw.voiceover ?? {}) },
    exportSettings: { ...base.exportSettings, ...(raw.exportSettings ?? {}) },
    scenes: (raw.scenes ?? []).map((s) => createScene(s)),
    media: raw.media ?? [],
  };
}

export function totalDuration(scenes: Scene[]) {
  return scenes.reduce((sum, s) => sum + (Number(s.durationSec) || 0), 0);
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}
