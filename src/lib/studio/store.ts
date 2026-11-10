import { useSyncExternalStore } from "react";

import { createProject, normalizeProject, uid } from "./project-factory";
import type { Project } from "./types";

const STORAGE_KEY = "vexaro.projects.v1";
const EMPTY: Project[] = [];
const listeners = new Set<() => void>();
let state: Project[] | null = null;

function load(): Project[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeProject) : [];
  } catch {
    return [];
  }
}

function getSnapshot() {
  if (state === null) state = load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: Project[]) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Could not save projects", error);
  }
  listeners.forEach((l) => l());
}

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export function useProject(id: string): Project | undefined {
  return useProjects().find((p) => p.id === id);
}

/** False during server render and the first hydration pass, true once local data is readable. */
export function useStoreReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

type Updater = Partial<Project> | ((p: Project) => Partial<Project>);

export const projectActions = {
  create(input: Parameters<typeof createProject>[0] = {}) {
    const project = createProject(input);
    commit([project, ...getSnapshot()]);
    return project;
  },
  update(id: string, updater: Updater) {
    commit(
      getSnapshot().map((p) => {
        if (p.id !== id) return p;
        const patch = typeof updater === "function" ? updater(p) : updater;
        return { ...p, ...patch, updatedAt: Date.now() };
      }),
    );
  },
  rename(id: string, name: string) {
    projectActions.update(id, { name: name.trim() || "Untitled project" });
  },
  remove(id: string) {
    commit(getSnapshot().filter((p) => p.id !== id));
  },
  duplicate(id: string) {
    const source = getSnapshot().find((p) => p.id === id);
    if (!source) return undefined;
    const now = Date.now();
    const copy: Project = {
      ...structuredClone(source),
      id: uid("prj"),
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    commit([copy, ...getSnapshot()]);
    return copy;
  },
  importProject(raw: unknown) {
    if (!raw || typeof raw !== "object") throw new Error("This file is not a VEXARO project.");
    const data = (raw as { project?: unknown }).project ?? raw;
    const project = normalizeProject({ ...(data as Partial<Project>), id: uid("prj") });
    // Media files are stored on the original device only.
    project.media = [];
    project.scenes = project.scenes.map((s) => ({ ...s, mediaId: null }));
    project.voiceover = { ...project.voiceover, audioMediaId: null };
    commit([project, ...getSnapshot()]);
    return project;
  },
};
