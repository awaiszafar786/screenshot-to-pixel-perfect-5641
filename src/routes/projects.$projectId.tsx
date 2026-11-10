import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AudioLines, ChevronLeft, Clapperboard, LayoutPanelTop, PenLine, Settings2, Upload } from "lucide-react";
import { useState } from "react";

import { AspectIcon } from "@/components/studio/controls";
import { RenameProjectDialog } from "@/components/studio/project-dialogs";
import { ProjectProvider } from "@/components/studio/project-context";
import { Button } from "@/components/ui/button";
import { useProject, useStoreReady } from "@/lib/studio/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayout,
});

const STEPS = [
  { to: "/projects/$projectId/script", label: "Script", icon: <PenLine /> },
  { to: "/projects/$projectId/storyboard", label: "Board", icon: <LayoutPanelTop /> },
  { to: "/projects/$projectId/voice", label: "Voice", icon: <AudioLines /> },
  { to: "/projects/$projectId/workspace", label: "Studio", icon: <Clapperboard /> },
  { to: "/projects/$projectId/export", label: "Export", icon: <Upload /> },
] as const;

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const ready = useStoreReady();
  const project = useProject(projectId);
  const [renameOpen, setRenameOpen] = useState(false);

  if (!ready) {
    return <div className="min-h-dvh bg-page" />;
  }

  if (!project) {
    return (
      <div className="grid min-h-dvh place-items-center bg-page px-6 text-center">
        <div>
          <p className="font-display text-xl font-bold">Project not found</p>
          <p className="mt-2 text-sm text-muted-foreground">It may have been deleted, or it was created on another device.</p>
          <Button asChild variant="glow" className="mt-5">
            <Link to="/">Back to projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProjectProvider project={project}>
      <div className="min-h-dvh bg-page">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2">
            <Button asChild variant="ghost" size="icon" aria-label="All projects">
              <Link to="/">
                <ChevronLeft className="size-5" />
              </Link>
            </Button>
            <button type="button" onClick={() => setRenameOpen(true)} className="min-w-0 flex-1 text-left" aria-label="Rename project">
              <p className="truncate font-display text-sm font-semibold">{project.name}</p>
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <AspectIcon ratio={project.aspectRatio} className="scale-75" /> {project.aspectRatio} · Saved on device
              </p>
            </button>
            <Button asChild variant="ghost" size="icon" aria-label="Project settings">
              <Link to="/projects/$projectId" params={{ projectId }} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>
                <Settings2 className="size-5" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">
          <Outlet />
        </main>

        <nav aria-label="Project steps" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 backdrop-blur-xl pb-safe">
          <div className="mx-auto grid max-w-3xl grid-cols-5 px-1 pt-2">
            {STEPS.map((step) => (
              <Link key={step.to} to={step.to} params={{ projectId }} className="flex flex-col items-center gap-1 py-1 text-muted-foreground data-[status=active]:text-primary">
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <span className={cn("grid h-8 w-12 place-items-center rounded-full transition-all [&_svg]:size-[18px]", isActive && "bg-primary/15 glow-primary")}>{step.icon}</span>
                    <span className="text-[10px] font-semibold">{step.label}</span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>

        <RenameProjectDialog projectId={project.id} currentName={project.name} open={renameOpen} onOpenChange={setRenameOpen} />
      </div>
    </ProjectProvider>
  );
}
