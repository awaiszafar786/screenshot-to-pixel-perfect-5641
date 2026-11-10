import { createContext, useCallback, useContext } from "react";

import { projectActions } from "@/lib/studio/store";
import type { Project } from "@/lib/studio/types";

interface ProjectContextValue {
  project: Project;
  update: (updater: Partial<Project> | ((p: Project) => Partial<Project>)) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ project, children }: { project: Project; children: React.ReactNode }) {
  const update = useCallback<ProjectContextValue["update"]>((updater) => projectActions.update(project.id, updater), [project.id]);
  return <ProjectContext.Provider value={{ project, update }}>{children}</ProjectContext.Provider>;
}

export function useCurrentProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useCurrentProject must be used inside a project page");
  return ctx;
}
