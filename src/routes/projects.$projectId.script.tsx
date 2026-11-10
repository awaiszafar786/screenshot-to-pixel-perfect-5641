import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Copy, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConnectedNote, SectionLabel, StatusBadge } from "@/components/studio/brand";
import { ChipGroup, Field } from "@/components/studio/controls";
import { useCurrentProject } from "@/components/studio/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateScript } from "@/lib/ai/ai.functions";
import { DURATION_PRESETS, LANGUAGE_LABELS, VIDEO_STYLES, type ScriptLanguage } from "@/lib/studio/types";

export const Route = createFileRoute("/projects/$projectId/script")({
  head: () => ({
    meta: [
      { title: "AI Script Writer — VEXARO AI Studio" },
      { name: "description", content: "Generate video scripts in English, Urdu and Roman Urdu with Lovable AI." },
      { property: "og:title", content: "AI Script Writer — VEXARO AI Studio" },
      { property: "og:description", content: "Generate video scripts in English, Urdu and Roman Urdu." },
    ],
  }),
  component: ScriptPage,
});

function ScriptPage() {
  const { project, update } = useCurrentProject();
  const runGenerate = useServerFn(generateScript);
  const [loading, setLoading] = useState(false);
  const { script } = project;
  const rtl = project.language === "urdu";

  const setScript = (patch: Partial<typeof script>) => update((p) => ({ script: { ...p.script, ...patch } }));

  const onGenerate = async () => {
    if (script.topic.trim().length < 3) {
      toast.error("Describe your video topic first (at least a few words).");
      return;
    }
    if (script.body.trim() && !window.confirm("Replace the current script with a new AI draft?")) return;
    setLoading(true);
    try {
      const res = await runGenerate({
        data: {
          topic: script.topic,
          audience: script.audience,
          language: project.language,
          durationSec: project.durationSec,
          style: project.style,
          aspectRatio: project.aspectRatio,
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setScript({
        title: res.data.title,
        hook: res.data.hook,
        body: res.data.script,
        cta: res.data.cta,
        hashtags: res.data.hashtags.map((h) => h.replace(/^#/, "")),
      });
      if (!project.description) update({ description: res.data.title });
      toast.success("Script ready — edit anything you like.");
    } catch {
      toast.error("Could not reach the script writer. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const words = script.body.trim() ? script.body.trim().split(/\s+/).length : 0;
  const estSeconds = Math.round(words / (project.language === "english" ? 2.5 : 2.2));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Step 01</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold">Script Writer</h1>
        </div>
        <StatusBadge connected />
      </div>

      <section className="panel space-y-5 p-4">
        <Field label="What is your video about?">
          <Textarea
            value={script.topic}
            onChange={(e) => setScript({ topic: e.target.value })}
            placeholder="e.g. 5 tips to save money as a university student in Lahore"
            rows={3}
            maxLength={600}
            className="rounded-xl bg-surface"
          />
        </Field>
        <Field label="Audience" hint="Optional">
          <Input value={script.audience} onChange={(e) => setScript({ audience: e.target.value })} placeholder="e.g. young professionals, parents, gamers" maxLength={160} className="h-11 rounded-xl bg-surface" />
        </Field>
        <Field label="Language">
          <ChipGroup
            ariaLabel="Script language"
            value={project.language}
            onChange={(language) => update({ language })}
            options={(Object.keys(LANGUAGE_LABELS) as ScriptLanguage[]).map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
          />
        </Field>
        <Field label="Duration">
          <ChipGroup ariaLabel="Duration" value={project.durationSec} onChange={(durationSec) => update({ durationSec })} options={DURATION_PRESETS.map((d) => ({ value: d, label: d < 60 ? `${d}s` : `${Math.floor(d / 60)}m${d % 60 ? `${d % 60}s` : ""}` }))} />
        </Field>
        <Field label="Style">
          <ChipGroup ariaLabel="Style" value={project.style} onChange={(style) => update({ style })} options={VIDEO_STYLES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <div className="space-y-2">
          <Button variant="hero" size="lg" className="w-full" onClick={onGenerate} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Writing your script…" : script.body ? "Generate a new draft" : "Generate script"}
          </Button>
          <ConnectedNote text="Powered by Lovable AI · uses your workspace's AI allowance" />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <SectionLabel>Your script</SectionLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              {words} words · about {estSeconds}s spoken · target {project.durationSec}s
            </p>
          </div>
          <Button
            variant="surface"
            size="sm"
            disabled={!script.body}
            onClick={() => {
              navigator.clipboard.writeText([script.title, script.body, script.cta].filter(Boolean).join("\n\n"));
              toast.success("Script copied");
            }}
          >
            <Copy /> Copy
          </Button>
        </div>

        <Field label="Title">
          <Input dir={rtl ? "rtl" : "ltr"} value={script.title} onChange={(e) => setScript({ title: e.target.value })} placeholder="Video title" className="h-11 rounded-xl bg-surface" />
        </Field>
        <Field label="Hook" hint="First 3 seconds">
          <Textarea dir={rtl ? "rtl" : "ltr"} value={script.hook} onChange={(e) => setScript({ hook: e.target.value })} rows={2} className="rounded-xl bg-surface" />
        </Field>
        <Field label="Full script" hint="Blank line = new beat">
          <Textarea
            dir={rtl ? "rtl" : "ltr"}
            value={script.body}
            onChange={(e) => setScript({ body: e.target.value })}
            rows={12}
            placeholder="Generate a script above, or write your own here."
            className={rtl ? "rounded-xl bg-surface font-urdu-text text-base" : "rounded-xl bg-surface text-[15px] leading-relaxed"}
          />
        </Field>
        <Field label="Call to action">
          <Input dir={rtl ? "rtl" : "ltr"} value={script.cta} onChange={(e) => setScript({ cta: e.target.value })} className="h-11 rounded-xl bg-surface" />
        </Field>
        <Field label="Hashtags" hint="Comma separated">
          <Input
            value={script.hashtags.join(", ")}
            onChange={(e) => setScript({ hashtags: e.target.value.split(",").map((h) => h.trim().replace(/^#/, "")).filter(Boolean) })}
            className="h-11 rounded-xl bg-surface"
          />
        </Field>

        <Button asChild variant="violet" size="lg" className="w-full" disabled={!script.body}>
          <Link to="/projects/$projectId/storyboard" params={{ projectId: project.id }}>
            <Wand2 /> Turn into storyboard <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}
