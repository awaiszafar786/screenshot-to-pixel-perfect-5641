import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";

import { LANGUAGE_LABELS, type ScriptLanguage } from "@/lib/studio/types";

const languageSchema = z.enum(["english", "urdu", "roman-urdu"]);
const aspectSchema = z.enum(["9:16", "1:1", "16:9"]);

const scriptInput = z.object({
  topic: z.string().trim().min(3).max(600),
  language: languageSchema,
  durationSec: z.number().int().min(10).max(600),
  style: z.string().trim().min(2).max(60),
  aspectRatio: aspectSchema,
  audience: z.string().trim().max(160).default(""),
});

const storyboardInput = z.object({
  script: z.string().trim().min(20).max(12000),
  language: languageSchema,
  durationSec: z.number().int().min(10).max(600),
  style: z.string().trim().min(2).max(60),
  aspectRatio: aspectSchema,
});

const scriptOutput = z.object({
  title: z.string(),
  hook: z.string(),
  script: z.string(),
  cta: z.string(),
  hashtags: z.array(z.string()),
});

const storyboardOutput = z.object({
  scenes: z.array(
    z.object({
      title: z.string(),
      narration: z.string(),
      subtitle: z.string(),
      visual: z.string(),
      imagePrompt: z.string(),
      videoPrompt: z.string(),
      durationSec: z.number(),
    }),
  ),
});

export type GeneratedScript = z.infer<typeof scriptOutput>;
export type GeneratedStoryboard = z.infer<typeof storyboardOutput>;
export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

function languageGuide(language: ScriptLanguage) {
  if (language === "urdu")
    return "Write all spoken text in natural Urdu using Urdu (Nastaliq) script. Do not use Roman letters for Urdu.";
  if (language === "roman-urdu")
    return "Write all spoken text in Roman Urdu: Urdu language written with English/Latin letters, the way Pakistanis text (e.g. 'Aaj hum baat karenge...').";
  return "Write all spoken text in clear, natural English.";
}

async function runSafely<T>(fn: () => Promise<T>): Promise<AiResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const { AiGenerationError } = await import("./gateway.server");
    if (error instanceof AiGenerationError) return { ok: false, error: error.message, status: error.status };
    console.error(error);
    return { ok: false, error: "Something went wrong while generating. Please try again.", status: 500 };
  }
}

export const generateScript = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scriptInput.parse(input))
  .handler(async ({ data }) =>
    runSafely(async () => {
      const { generateStructured } = await import("./gateway.server");
      const words = Math.round((data.durationSec / 60) * (data.language === "english" ? 150 : 130));
      return generateStructured({
        schema: scriptOutput,
        instructions: [
          "You are a senior short-form video scriptwriter for creators in Pakistan and worldwide.",
          "Write voiceover-ready scripts: spoken, punchy, no stage directions inside the script text, no markdown, no emojis.",
          languageGuide(data.language),
          "Separate paragraphs with a blank line. Each paragraph should be one beat of the video.",
          "Hashtags: 5-8 relevant tags without the # symbol.",
        ].join("\n"),
        prompt: [
          `Topic: ${data.topic}`,
          `Language: ${LANGUAGE_LABELS[data.language]}`,
          `Target length: ${data.durationSec} seconds (about ${words} spoken words in total, including hook and call to action).`,
          `Style / tone: ${data.style}`,
          `Format: ${data.aspectRatio} video`,
          data.audience ? `Audience: ${data.audience}` : "",
          "Return: a short title, a 1-2 sentence opening hook, the full script body (including the hook as its first paragraph), and a closing call to action.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    }),
  );

export const generateStoryboard = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => storyboardInput.parse(input))
  .handler(async ({ data }) =>
    runSafely(async () => {
      const { generateStructured } = await import("./gateway.server");
      const targetScenes = Math.min(14, Math.max(3, Math.round(data.durationSec / 6)));
      const result = await generateStructured({
        schema: storyboardOutput,
        instructions: [
          "You are a film director and storyboard artist preparing a video for AI image and AI video generators.",
          "Split the script into sequential scenes. Keep the narration of each scene exactly in the script's language and wording (light trimming allowed).",
          "subtitle: a short on-screen caption version of the narration in the same language (max ~12 words).",
          "visual: 1-2 sentences in English describing what the viewer sees.",
          "imagePrompt: a detailed English prompt for an AI image model — subject, setting, composition, lens, lighting, color palette, mood, style keywords, and the aspect ratio.",
          "videoPrompt: a detailed English prompt for an AI video model — the same scene plus camera movement, subject motion, pacing and transitions, in present tense.",
          "Keep characters, wardrobe and locations visually consistent across scenes by repeating key descriptors.",
          "durationSec: whole seconds for each scene; the total should match the requested length.",
        ].join("\n"),
        prompt: [
          `Requested length: ${data.durationSec} seconds, roughly ${targetScenes} scenes.`,
          `Visual style: ${data.style}`,
          `Aspect ratio: ${data.aspectRatio}`,
          `Script language: ${LANGUAGE_LABELS[data.language]}`,
          "Script:",
          data.script,
        ].join("\n"),
      });
      return {
        scenes: result.scenes.map((s) => ({
          ...s,
          durationSec: Math.min(60, Math.max(1, Math.round(s.durationSec || 5))),
        })),
      };
    }),
  );
