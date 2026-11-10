import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, AudioLines, Clapperboard, LayoutPanelTop, PenLine, Upload } from "lucide-react";

import { SectionLabel } from "@/components/studio/brand";
import { AspectIcon, ChipGroup, Field, Segmented } from "@/components/studio/controls";
import { useCurrentProject } from "@/components/studio/project-context";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatClock } from "@/lib/studio/exporters";
import { totalDuration } from "@/lib/studio/project-factory";
import { ASPECT_RATIOS, DURATION_PRESETS, LANGUAGE_LABELS, VIDEO_STYLES, type ScriptLanguage } from "@/lib/studio/types";

export const Route = createFileRoute("/projects/$projectId/")({
  head: () => ({
    meta: [
      { title: "Project settings — VEXARO AI Studio" },
      { name: "description", content: "Set the language, style, length and format of your video project." },
      { property: "og:title", content: "Project settings — VEXARO AI Studio" },
      { property: "og:description", content: "Set the language, style, length and format of your video project." },
    ],
  }),
  component: ProjectOverview,
});

function ProjectOverview() {
  const { project, update } = useCurrentProject();
  const params = { projectId: project.id };

  const steps = [
    { to: "/projects/$projectId/script" as const, label: "Write the script", icon: <PenLine />, done: Boolean(project.script.body.trim()), meta: project.script.body ? `${project.script.body.split(/\s+/).length} words` : "Not started" },
    { to: "/projects/$projectId/storyboard" as const, label: "Build the storyboard", icon: <LayoutPanelTop />, done: project.scenes.length > 0, meta: `${project.scenes.length} scenes` },
    { to: "/projects/$projectId/voice" as const, label: "Prepare voiceover", icon: <AudioLines />, done: Boolean(project.voiceover.text || project.voiceover.audioMediaId), meta: project.voiceover.audioMediaId ? "Audio uploaded" : project.voiceover.text ? "Text ready" : "Not started" },
    { to: "/projects/$projectId/workspace" as const, label: "Arrange the timeline", icon: <Clapperboard />, done: project.scenes.some((s) => s.mediaId), meta: `${project.media.length} media · ${formatClock(totalDuration(project.scenes))}` },
    { to: "/projects/$projectId/export" as const, label: "Export", icon: <Upload />, done: false, meta: `${project.exportSettings.resolution} · ${project.exportSettings.fps}fps` },
  ];

  return (
    <div className="space-y-7">
      <section>
        <SectionLabel>Workflow</SectionLabel>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={s.to}>
              <Link to={s.to} params={params} className="panel flex items-center gap-3 p-3 transition-colors hover:border-primary/40">
                <span className={s.done ? "grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground [&_svg]:size-4" : "grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-4"}>{s.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{s.meta}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-5">
        <SectionLabel>Project details</SectionLabel>
        <Field label="Name">
          <Input value={project.name} onChange={(e) => update({ name: e.target.value })} maxLength={80} className="h-11 rounded-xl bg-surface" />
        </Field>
        <Field label="Description">
          <Textarea value={project.description} onChange={(e) => update({ description: e.target.value })} rows={3} maxLength={300} placeholder="Notes about this video" className="rounded-xl bg-surface" />
        </Field>
        <Field label="Script language">
          <ChipGroup
            ariaLabel="Script language"
            value={project.language}
            onChange={(language) => update({ language })}
            options={(Object.keys(LANGUAGE_LABELS) as ScriptLanguage[]).map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
          />
        </Field>
        <Field label="Video style">
          <ChipGroup ariaLabel="Video style" value={project.style} onChange={(style) => update({ style })} options={VIDEO_STYLES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Target length" hint={formatClock(project.durationSec)}>
          <ChipGroup ariaLabel="Target length" value={project.durationSec} onChange={(durationSec) => update({ durationSec })} options={DURATION_PRESETS.map((d) => ({ value: d, label: d < 60 ? `${d}s` : `${d / 60}m${d % 60 ? ` ${d % 60}s` : ""}` }))} />
        </Field>
        <Field label="Format">
          <Segmented
            ariaLabel="Format"
            value={project.aspectRatio}
            onChange={(aspectRatio) => update({ aspectRatio })}
            options={ASPECT_RATIOS.map((r) => ({
              value: r.value,
              label: (
                <span className="flex flex-col items-center gap-0.5 py-1">
                  <span className="flex items-center gap-1.5">
                    <AspectIcon ratio={r.value} /> {r.label}
                  </span>
                  <span className="text-[9px] font-medium opacity-70">{r.hint}</span>
                </span>
              ),
            }))}
          />
        </Field>
      </section>
    </div>
  );
}
