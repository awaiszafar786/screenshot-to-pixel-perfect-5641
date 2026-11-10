import type { Project, Scene } from "./types";

function pad(n: number, size = 2) {
  return String(Math.floor(n)).padStart(size, "0");
}

export function formatSrtTime(totalSec: number) {
  const ms = Math.round((totalSec % 1) * 1000);
  const s = Math.floor(totalSec);
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)},${pad(ms, 3)}`;
}

export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  return `${pad(s / 60)}:${pad(s % 60)}`;
}

/** Build an .srt file from scene subtitles (falls back to narration) using scene durations. */
export function buildSrt(scenes: Scene[]) {
  let cursor = 0;
  const blocks: string[] = [];
  scenes.forEach((scene) => {
    const start = cursor;
    const duration = Math.max(0, Number(scene.durationSec) || 0);
    cursor += duration;
    const text = (scene.subtitle || scene.narration).trim();
    if (!text || duration === 0) return;
    blocks.push(`${blocks.length + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(cursor)}\n${text}`);
  });
  return blocks.join("\n\n") + (blocks.length ? "\n" : "");
}

export function buildScriptText(project: Project) {
  const s = project.script;
  return [
    s.title || project.name,
    "",
    s.body || [s.hook, s.cta].filter(Boolean).join("\n\n"),
    "",
    s.cta && s.body && !s.body.includes(s.cta) ? s.cta : "",
    s.hashtags.length ? `\n${s.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}` : "",
  ]
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n")
    .trim();
}

export function buildStoryboardMarkdown(project: Project) {
  const lines = [`# ${project.name} — Storyboard`, "", `Format: ${project.aspectRatio} · Style: ${project.style}`, ""];
  project.scenes.forEach((scene, i) => {
    lines.push(
      `## Scene ${i + 1}: ${scene.title} (${scene.durationSec}s)`,
      "",
      `**Narration:** ${scene.narration}`,
      "",
      `**Subtitle:** ${scene.subtitle}`,
      "",
      `**Visual:** ${scene.visual}`,
      "",
      `**Image prompt:** ${scene.imagePrompt}`,
      "",
      `**Video prompt:** ${scene.videoPrompt}`,
      "",
    );
  });
  return lines.join("\n");
}

export function buildProjectBackup(project: Project) {
  return JSON.stringify({ app: "VEXARO AI Studio", version: 1, exportedAt: new Date().toISOString(), project }, null, 2);
}

export function safeFileName(name: string) {
  return name.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-").toLowerCase() || "vexaro-project";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, type = "text/plain") {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}
