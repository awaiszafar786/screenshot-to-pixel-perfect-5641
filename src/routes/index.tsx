import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Copy, Download, FileUp, Film, MoreVertical, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import heroImage from "@/assets/studio-hero.jpg";
import { AppChrome } from "@/components/studio/app-chrome";
import { SectionLabel } from "@/components/studio/brand";
import { AspectIcon } from "@/components/studio/controls";
import { CreateProjectDialog, RenameProjectDialog } from "@/components/studio/project-dialogs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { buildProjectBackup, downloadText, formatClock, safeFileName } from "@/lib/studio/exporters";
import { deleteMediaFile } from "@/lib/studio/media-db";
import { totalDuration } from "@/lib/studio/project-factory";
import { projectActions, useProjects, useStoreReady } from "@/lib/studio/store";
import { LANGUAGE_LABELS, type Project } from "@/lib/studio/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Projects — VEXARO AI Studio" },
      { name: "description", content: "Your AI video project library: scripts, storyboards, voiceovers and timelines in one mobile studio." },
      { property: "og:title", content: "VEXARO AI Studio — Project library" },
      { property: "og:description", content: "Create and manage AI video projects in English, Urdu and Roman Urdu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const projects = useProjects();
  const ready = useStoreReady();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);
    return q ? sorted.filter((p) => `${p.name} ${p.description} ${p.script.topic}`.toLowerCase().includes(q)) : sorted;
  }, [projects, query]);

  const stats = useMemo(
    () => ({
      count: projects.length,
      scenes: projects.reduce((n, p) => n + p.scenes.length, 0),
      seconds: projects.reduce((n, p) => n + totalDuration(p.scenes), 0),
    }),
    [projects],
  );

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const project = projectActions.importProject(JSON.parse(await file.text()));
      toast.success(`Imported “${project.name}”`);
      navigate({ to: "/projects/$projectId", params: { projectId: project.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import this file.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <AppChrome
      action={
        <Button variant="glow" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus /> New
        </Button>
      }
    >
      <section className="relative overflow-hidden rounded-3xl border border-border">
        <img src={heroImage} alt="" width={1024} height={1280} className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
        <div className="relative flex min-h-[300px] flex-col justify-end p-5">
          <SectionLabel className="text-primary">Create · Direct · Export</SectionLabel>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.1]">
            Your AI <span className="text-gradient-brand">video studio</span>, in your pocket.
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Write scripts in English, Urdu or Roman Urdu, plan every scene and arrange your clips.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="hero" size="lg" className="flex-1" onClick={() => setCreateOpen(true)}>
              <Sparkles /> Start a video
            </Button>
            <Button variant="surface" size="lg" onClick={() => importRef.current?.click()} aria-label="Import project file">
              <FileUp />
            </Button>
          </div>
        </div>
      </section>
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />

      <section className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Projects" value={String(stats.count)} />
        <Stat label="Scenes" value={String(stats.scenes)} />
        <Stat label="Runtime" value={formatClock(stats.seconds)} />
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <SectionLabel>Library</SectionLabel>
            <h2 className="mt-1 text-lg font-semibold">Your projects</h2>
          </div>
        </div>
        {projects.length > 0 && (
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="h-11 rounded-xl bg-surface pl-10" aria-label="Search projects" />
          </div>
        )}

        {!ready ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyLibrary onCreate={() => setCreateOpen(true)} />
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">No projects match “{query}”.</p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((p, i) => (
              <li key={p.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </AppChrome>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-3">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyLibrary({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="panel bg-grid flex flex-col items-center px-6 py-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-gradient-brand-soft text-primary glow-primary">
        <Film className="size-6" />
      </div>
      <p className="mt-4 font-display text-base font-semibold">No projects yet</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">Create your first video project. Everything is saved on this device.</p>
      <Button variant="glow" className="mt-5" onClick={onCreate}>
        <Plus /> Create project
      </Button>
    </div>
  );
}

function progressOf(p: Project) {
  return [
    { label: "Script", done: Boolean(p.script.body.trim()) },
    { label: "Board", done: p.scenes.length > 0 },
    { label: "Voice", done: Boolean(p.voiceover.text.trim() || p.voiceover.audioMediaId) },
    { label: "Media", done: p.scenes.some((s) => s.mediaId) },
  ];
}

function ProjectCard({ project }: { project: Project }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const steps = progressOf(project);
  const doneCount = steps.filter((s) => s.done).length;

  const onDelete = async () => {
    projectActions.remove(project.id);
    await Promise.all(project.media.map((m) => deleteMediaFile(m.id).catch(() => undefined)));
    toast.success("Project deleted");
  };

  return (
    <div className="panel relative overflow-hidden p-4 transition-all hover:border-primary/40">
      <div className="flex items-start gap-3">
        <Link to="/projects/$projectId" params={{ projectId: project.id }} className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-brand-soft text-primary">
            <AspectIcon ratio={project.aspectRatio} className="scale-125" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{project.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {project.description || project.script.topic || "No description yet"}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {project.aspectRatio} · {LANGUAGE_LABELS[project.language].split(" ")[0]} · {project.scenes.length} scenes · {formatClock(totalDuration(project.scenes))}
            </p>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Options for ${project.name}`}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                projectActions.duplicate(project.id);
                toast.success("Project duplicated (media stays linked to the original)");
              }}
            >
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadText(buildProjectBackup(project), `${safeFileName(project.name)}.vexaro.json`, "application/json")}>
              <Download /> Download backup
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {steps.map((s) => (
          <div key={s.label} className="flex-1">
            <div className={s.done ? "h-1 rounded-full bg-gradient-brand" : "h-1 rounded-full bg-muted"} />
            <p className="mt-1 text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
        <p className="ml-2 shrink-0 text-[10px] text-muted-foreground">
          {doneCount}/4 · {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
        </p>
      </div>

      <RenameProjectDialog projectId={project.id} currentName={project.name} open={renameOpen} onOpenChange={setRenameOpen} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the project and its uploaded media from this device. It cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
