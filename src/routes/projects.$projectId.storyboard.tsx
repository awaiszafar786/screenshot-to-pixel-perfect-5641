import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowRight, ArrowUp, ChevronDown, Copy, CopyPlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConnectedNote, SectionLabel, StatusBadge } from "@/components/studio/brand";
import { Field } from "@/components/studio/controls";
import { useCurrentProject } from "@/components/studio/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateStoryboard } from "@/lib/ai/ai.functions";
import { formatClock } from "@/lib/studio/exporters";
import { createScene, moveItem, totalDuration } from "@/lib/studio/project-factory";
import type { Scene } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/storyboard")({
  head: () => ({
    meta: [
      { title: "AI Storyboard — VEXARO AI Studio" },
      { name: "description", content: "Break your script into scenes with detailed AI image and video prompts." },
      { property: "og:title", content: "AI Storyboard — VEXARO AI Studio" },
      { property: "og:description", content: "Break your script into scenes with detailed AI image and video prompts." },
    ],
  }),
  component: StoryboardPage,
});

function StoryboardPage() {
  const { project, update } = useCurrentProject();
  const runGenerate = useServerFn(generateStoryboard);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const scenes = project.scenes;
  const rtl = project.language === "urdu";

  const setScenes = (fn: (s: Scene[]) => Scene[]) => update((p) => ({ scenes: fn(p.scenes) }));
  const patchScene = (id: string, patch: Partial<Scene>) => setScenes((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const onGenerate = async () => {
    const script = project.script.body.trim();
    if (script.length < 20) {
      toast.error("Write or generate a script first.");
      return;
    }
    if (scenes.length && !window.confirm("Replace your current scenes with a new AI storyboard? Uploaded media links on scenes will be cleared.")) return;
    setLoading(true);
    try {
      const res = await runGenerate({
        data: { script, language: project.language, durationSec: project.durationSec, style: project.style, aspectRatio: project.aspectRatio },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const next = res.data.scenes.map((s) => createScene(s));
      update({ scenes: next });
      setOpenId(next[0]?.id ?? null);
      toast.success(`${next.length} scenes created`);
    } catch {
      toast.error("Could not reach the storyboard engine. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyAllPrompts = () => {
    const text = scenes
      .map((s, i) => `Scene ${i + 1} — ${s.title}\nIMAGE: ${s.imagePrompt}\nVIDEO: ${s.videoPrompt}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("All prompts copied");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel>Step 02</SectionLabel>
          <h1 className="mt-1 text-2xl font-bold">Storyboard</h1>
        </div>
        <StatusBadge connected />
      </div>

      <section className="panel space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          {project.script.body.trim()
            ? "Split your script into scenes with ready-to-use prompts for AI image and video tools."
            : "No script yet. Write one first, or add scenes by hand below."}
        </p>
        {project.script.body.trim() ? (
          <Button variant="hero" size="lg" className="w-full" onClick={onGenerate} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Directing scenes…" : scenes.length ? "Regenerate storyboard" : "Generate storyboard"}
          </Button>
        ) : (
          <Button asChild variant="surface" size="lg" className="w-full">
            <Link to="/projects/$projectId/script" params={{ projectId: project.id }}>
              Go to script writer <ArrowRight />
            </Link>
          </Button>
        )}
        <ConnectedNote text="Powered by Lovable AI" />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <SectionLabel>Scenes</SectionLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              {scenes.length} scenes · {formatClock(totalDuration(scenes))} total · target {formatClock(project.durationSec)}
            </p>
          </div>
          {scenes.length > 0 && (
            <Button variant="surface" size="sm" onClick={copyAllPrompts}>
              <Copy /> Prompts
            </Button>
          )}
        </div>

        <ol className="space-y-3">
          {scenes.map((scene, i) => {
            const open = openId === scene.id;
            return (
              <li key={scene.id} className={cn("panel overflow-hidden transition-colors", open && "border-secondary/50")}>
                <div className="flex items-center gap-2 p-3">
                  <button type="button" onClick={() => setOpenId(open ? null : scene.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={open}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand-soft font-mono text-xs font-semibold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{scene.title || `Scene ${i + 1}`}</span>
                      <span dir={rtl ? "rtl" : "ltr"} className="block truncate text-xs text-muted-foreground">
                        {scene.narration || "No narration"}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{scene.durationSec}s</span>
                    <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>
                </div>
                <div className="flex items-center gap-1 border-t border-border/60 px-2 py-1.5">
                  <Button variant="ghost" size="icon-sm" aria-label="Move scene up" disabled={i === 0} onClick={() => setScenes((l) => moveItem(l, i, i - 1))}>
                    <ArrowUp />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Move scene down" disabled={i === scenes.length - 1} onClick={() => setScenes((l) => moveItem(l, i, i + 1))}>
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Duplicate scene"
                    onClick={() => setScenes((l) => [...l.slice(0, i + 1), createScene({ ...scene, id: "", title: `${scene.title} (copy)` }), ...l.slice(i + 1)])}
                  >
                    <CopyPlus />
                  </Button>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete scene"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete “${scene.title || `Scene ${i + 1}`}”?`)) setScenes((l) => l.filter((s) => s.id !== scene.id));
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {open && <SceneEditor scene={scene} rtl={rtl} onChange={(patch) => patchScene(scene.id, patch)} />}
              </li>
            );
          })}
        </ol>

        <Button
          variant="surface"
          size="lg"
          className="mt-3 w-full border-dashed"
          onClick={() => {
            const scene = createScene({ title: `Scene ${scenes.length + 1}` });
            setScenes((l) => [...l, scene]);
            setOpenId(scene.id);
          }}
        >
          <Plus /> Add scene
        </Button>
      </section>

      {scenes.length > 0 && (
        <Button asChild variant="violet" size="lg" className="w-full">
          <Link to="/projects/$projectId/voice" params={{ projectId: project.id }}>
            Continue to voiceover <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}

function SceneEditor({ scene, rtl, onChange }: { scene: Scene; rtl: boolean; onChange: (patch: Partial<Scene>) => void }) {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  return (
    <div className="space-y-4 border-t border-border/60 bg-surface/50 p-4 animate-rise">
      <div className="grid grid-cols-[1fr_88px] gap-3">
        <Field label="Title">
          <Input value={scene.title} onChange={(e) => onChange({ title: e.target.value })} className="h-10 rounded-xl bg-surface" />
        </Field>
        <Field label="Seconds">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={scene.durationSec}
            onChange={(e) => onChange({ durationSec: Math.min(60, Math.max(1, Number(e.target.value) || 1)) })}
            className="h-10 rounded-xl bg-surface"
          />
        </Field>
      </div>
      <Field label="Narration">
        <Textarea dir={rtl ? "rtl" : "ltr"} value={scene.narration} onChange={(e) => onChange({ narration: e.target.value })} rows={3} className={cn("rounded-xl bg-surface", rtl && "font-urdu-text")} />
      </Field>
      <Field label="On-screen subtitle">
        <Input dir={rtl ? "rtl" : "ltr"} value={scene.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} className="h-10 rounded-xl bg-surface" />
      </Field>
      <Field label="What we see">
        <Textarea value={scene.visual} onChange={(e) => onChange({ visual: e.target.value })} rows={2} className="rounded-xl bg-surface" />
      </Field>
      <PromptField label="AI image prompt" value={scene.imagePrompt} onChange={(imagePrompt) => onChange({ imagePrompt })} onCopy={() => copy(scene.imagePrompt, "Image prompt")} tone="primary" />
      <PromptField label="AI video prompt" value={scene.videoPrompt} onChange={(videoPrompt) => onChange({ videoPrompt })} onCopy={() => copy(scene.videoPrompt, "Video prompt")} tone="secondary" />
    </div>
  );
}

function PromptField({ label, value, onChange, onCopy, tone }: { label: string; value: string; onChange: (v: string) => void; onCopy: () => void; tone: "primary" | "secondary" }) {
  return (
    <div className={cn("rounded-xl border p-3", tone === "primary" ? "border-primary/25 bg-primary/5" : "border-secondary/30 bg-secondary/5")}>
      <div className="mb-2 flex items-center justify-between">
        <span className={cn("font-mono text-[10px] font-semibold uppercase tracking-widest", tone === "primary" ? "text-primary" : "text-secondary-glow")}>{label}</span>
        <Button variant="ghost" size="icon-sm" aria-label={`Copy ${label}`} onClick={onCopy} disabled={!value}>
          <Copy />
        </Button>
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="resize-y border-0 bg-transparent p-0 text-[13px] leading-relaxed shadow-none focus-visible:ring-0" />
    </div>
  );
}
