import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ImagePlus, Minus, Pause, Play, Plus, SkipBack, SkipForward, Trash2, Unlink, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { NotConnectedNotice, SectionLabel } from "@/components/studio/brand";
import { AspectIcon, aspectClass, Field, Segmented } from "@/components/studio/controls";
import { MediaKindIcon, MediaThumb } from "@/components/studio/media-thumb";
import { useCurrentProject } from "@/components/studio/project-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatClock } from "@/lib/studio/exporters";
import { deleteMediaFile, saveMediaFile, useMediaUrl } from "@/lib/studio/media-db";
import { createScene, moveItem, totalDuration } from "@/lib/studio/project-factory";
import { ASPECT_RATIOS, type MediaItem, type Project, type Scene } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/workspace")({
  head: () => ({
    meta: [
      { title: "Video Workspace — VEXARO AI Studio" },
      { name: "description", content: "Upload images and clips, arrange your timeline, edit subtitles and preview in 9:16, 1:1 or 16:9." },
      { property: "og:title", content: "Video Workspace — VEXARO AI Studio" },
      { property: "og:description", content: "Arrange clips on a timeline, edit subtitles and preview your video." },
    ],
  }),
  component: WorkspacePage,
});

function sceneAt(scenes: Scene[], t: number) {
  let start = 0;
  for (let i = 0; i < scenes.length; i++) {
    const end = start + (scenes[i]?.durationSec ?? 0);
    if (t < end) return { index: i, start };
    start = end;
  }
  return { index: Math.max(0, scenes.length - 1), start: Math.max(0, start - (scenes.at(-1)?.durationSec ?? 0)) };
}

function WorkspacePage() {
  const { project, update } = useCurrentProject();
  const scenes = project.scenes;
  const total = totalDuration(scenes);
  const [selectedId, setSelectedId] = useState<string | null>(scenes[0]?.id ?? null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [withVoice, setWithVoice] = useState(true);
  const uploadRef = useRef<HTMLInputElement>(null);
  const assignAfterUpload = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const voiceUrl = useMediaUrl(project.voiceover.audioMediaId);

  const selectedIndex = scenes.findIndex((s) => s.id === selectedId);
  const selected = selectedIndex >= 0 ? scenes[selectedIndex] : undefined;
  const current = sceneAt(scenes, time);
  const currentScene = scenes[current.index];
  const mediaById = useMemo(() => new Map(project.media.map((m) => [m.id, m])), [project.media]);
  const visualMedia = project.media.filter((m) => m.kind !== "audio");

  const setScenes = (fn: (s: Scene[]) => Scene[]) => update((p) => ({ scenes: fn(p.scenes) }));
  const patchScene = (id: string, patch: Partial<Scene>) => setScenes((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Playback clock
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => {
        const next = t + dt;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total]);

  // Keep voiceover audio in sync with the clock
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && withVoice) {
      if (Math.abs(audio.currentTime - time) > 0.4) audio.currentTime = time;
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, withVoice]);

  useEffect(() => {
    if (playing && currentScene) setSelectedId(currentScene.id);
  }, [playing, currentScene]);

  const seekToScene = (index: number) => {
    let start = 0;
    for (let i = 0; i < index; i++) start += scenes[i]?.durationSec ?? 0;
    setTime(start);
    if (audioRef.current) audioRef.current.currentTime = start;
    if (scenes[index]) setSelectedId(scenes[index].id);
  };

  const togglePlay = () => {
    if (!scenes.length) return void toast.error("Add a clip to the timeline first.");
    if (time >= total) setTime(0);
    setPlaying((p) => !p);
  };

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const items: MediaItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name} is not an image or video.`);
        continue;
      }
      try {
        items.push(await saveMediaFile(file));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Could not save ${file.name}`);
      }
    }
    if (items.length) {
      const target = assignAfterUpload.current;
      update((p) => ({
        media: [...p.media, ...items],
        scenes: target ? p.scenes.map((s) => (s.id === target ? { ...s, mediaId: items[0]!.id } : s)) : p.scenes,
      }));
      toast.success(`${items.length} file${items.length > 1 ? "s" : ""} added`);
    }
    assignAfterUpload.current = null;
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const removeMedia = async (item: MediaItem) => {
    if (!window.confirm(`Remove “${item.name}” from this project?`)) return;
    update((p) => ({
      media: p.media.filter((m) => m.id !== item.id),
      scenes: p.scenes.map((s) => (s.mediaId === item.id ? { ...s, mediaId: null } : s)),
    }));
    await deleteMediaFile(item.id).catch(() => undefined);
  };

  const addClip = () => {
    const scene = createScene({ title: `Clip ${scenes.length + 1}` });
    setScenes((l) => [...l, scene]);
    setSelectedId(scene.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Step 04</SectionLabel>
        <h1 className="mt-1 text-2xl font-bold">Video Workspace</h1>
      </div>

      <Segmented
        ariaLabel="Canvas format"
        value={project.aspectRatio}
        onChange={(aspectRatio) => update({ aspectRatio })}
        options={ASPECT_RATIOS.map((r) => ({
          value: r.value,
          label: (
            <span className="flex items-center justify-center gap-1.5">
              <AspectIcon ratio={r.value} /> {r.value}
            </span>
          ),
        }))}
      />

      {/* Preview */}
      <section className="panel overflow-hidden p-3">
        <div className="bg-grid flex justify-center rounded-xl bg-background/60 p-3">
          <div
            className={cn(
              "relative overflow-hidden rounded-lg bg-background ring-1 ring-border",
              aspectClass(project.aspectRatio),
              project.aspectRatio === "9:16" ? "h-[52dvh] max-h-[460px]" : "w-full",
            )}
          >
            <PreviewFrame project={project} scene={currentScene} media={currentScene?.mediaId ? mediaById.get(currentScene.mediaId) : undefined} playing={playing} />
          </div>
        </div>

        <div className="mt-3 px-1">
          <input
            type="range"
            min={0}
            max={Math.max(total, 0.1)}
            step={0.1}
            value={Math.min(time, total)}
            onChange={(e) => {
              const t = Number(e.target.value);
              setTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            className="w-full accent-[var(--primary)]"
            aria-label="Seek"
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatClock(time)} / {formatClock(total)}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" aria-label="Previous clip" onClick={() => seekToScene(Math.max(0, current.index - 1))}>
                <SkipBack />
              </Button>
              <Button variant="glow" size="icon" aria-label={playing ? "Pause preview" : "Play preview"} onClick={togglePlay} className="rounded-full">
                {playing ? <Pause /> : <Play />}
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Next clip" onClick={() => seekToScene(Math.min(scenes.length - 1, current.index + 1))}>
                <SkipForward />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!voiceUrl}
              aria-label={withVoice ? "Mute voiceover" : "Play with voiceover"}
              onClick={() => setWithVoice((v) => !v)}
              title={voiceUrl ? "Voiceover track" : "Upload a voiceover in the Voice step"}
            >
              {withVoice && voiceUrl ? <Volume2 /> : <VolumeX />}
            </Button>
          </div>
        </div>
        {voiceUrl && <audio ref={audioRef} src={voiceUrl} preload="auto" className="hidden" />}
      </section>

      {/* Timeline */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <SectionLabel>Timeline</SectionLabel>
          <span className="font-mono text-[10px] text-muted-foreground">{scenes.length} clips</span>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none">
          <div className="flex min-w-max items-stretch gap-1.5">
            {scenes.map((scene, i) => {
              const active = scene.id === selectedId;
              const isPlaying = i === current.index && (playing || time > 0);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(scene.id);
                    if (!playing) seekToScene(i);
                  }}
                  style={{ width: `${Math.max(72, scene.durationSec * 14)}px` }}
                  className={cn(
                    "relative h-20 overflow-hidden rounded-xl border-2 text-left transition-all",
                    active ? "border-primary glow-primary" : "border-border",
                    isPlaying && !active && "border-secondary",
                  )}
                  aria-label={`Clip ${i + 1}: ${scene.title}`}
                  aria-pressed={active}
                >
                  <MediaThumb item={scene.mediaId ? mediaById.get(scene.mediaId) : undefined} className="absolute inset-0 h-full w-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-1.5 pb-1 pt-4">
                    <span className="block truncate text-[10px] font-semibold">
                      {i + 1}. {scene.title}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground">{scene.durationSec}s</span>
                  </span>
                </button>
              );
            })}
            <button type="button" onClick={addClip} className="grid h-20 w-16 place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary" aria-label="Add clip">
              <Plus className="size-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Selected clip editor */}
      {selected ? (
        <section className="panel space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <SectionLabel>Clip {selectedIndex + 1}</SectionLabel>
              <p className="truncate font-semibold">{selected.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="surface" size="icon-sm" aria-label="Move clip left" disabled={selectedIndex === 0} onClick={() => setScenes((l) => moveItem(l, selectedIndex, selectedIndex - 1))}>
                <ChevronLeft />
              </Button>
              <Button variant="surface" size="icon-sm" aria-label="Move clip right" disabled={selectedIndex === scenes.length - 1} onClick={() => setScenes((l) => moveItem(l, selectedIndex, selectedIndex + 1))}>
                <ChevronRight />
              </Button>
              <Button
                variant="surface"
                size="icon-sm"
                className="text-destructive"
                aria-label="Delete clip"
                onClick={() => {
                  if (!window.confirm("Delete this clip from the timeline?")) return;
                  const nextSel = scenes[selectedIndex + 1]?.id ?? scenes[selectedIndex - 1]?.id ?? null;
                  setScenes((l) => l.filter((s) => s.id !== selected.id));
                  setSelectedId(nextSel);
                }}
              >
                <Trash2 />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MediaThumb item={selected.mediaId ? mediaById.get(selected.mediaId) : undefined} className="size-16 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Button
                variant="surface"
                size="sm"
                onClick={() => {
                  assignAfterUpload.current = selected.id;
                  uploadRef.current?.click();
                }}
              >
                <ImagePlus /> {selected.mediaId ? "Replace with upload" : "Upload image / video"}
              </Button>
              {selected.mediaId && (
                <Button variant="ghost" size="sm" onClick={() => patchScene(selected.id, { mediaId: null })}>
                  <Unlink /> Detach media
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2">
            <span className="text-xs font-semibold">Duration</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" aria-label="Shorter" onClick={() => patchScene(selected.id, { durationSec: Math.max(1, selected.durationSec - 1) })}>
                <Minus />
              </Button>
              <span className="w-10 text-center font-mono text-sm">{selected.durationSec}s</span>
              <Button variant="ghost" size="icon-sm" aria-label="Longer" onClick={() => patchScene(selected.id, { durationSec: Math.min(60, selected.durationSec + 1) })}>
                <Plus />
              </Button>
            </div>
          </div>

          <Field label="Subtitle" hint="Shown on the preview">
            <Textarea
              dir={project.language === "urdu" ? "rtl" : "ltr"}
              value={selected.subtitle}
              onChange={(e) => patchScene(selected.id, { subtitle: e.target.value })}
              rows={2}
              placeholder="Caption text for this clip"
              className={cn("rounded-xl bg-surface", project.language === "urdu" && "font-urdu-text")}
            />
          </Field>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Your timeline is empty. Tap + to add a clip, or build a storyboard first.
        </p>
      )}

      {/* Media library */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <SectionLabel>Media library</SectionLabel>
          <Button
            variant="surface"
            size="sm"
            onClick={() => {
              assignAfterUpload.current = null;
              uploadRef.current?.click();
            }}
          >
            <Plus /> Upload
          </Button>
        </div>
        <input ref={uploadRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
        {visualMedia.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            Upload photos or clips from your phone. Then tap one to place it on the selected clip.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {visualMedia.map((item) => {
              const inUse = scenes.some((s) => s.mediaId === item.id);
              return (
                <div key={item.id} className="group relative">
                  <button
                    type="button"
                    disabled={!selected}
                    onClick={() => selected && patchScene(selected.id, { mediaId: item.id })}
                    className={cn("relative block aspect-square w-full overflow-hidden rounded-xl border-2", selected?.mediaId === item.id ? "border-primary" : "border-border")}
                    aria-label={`Use ${item.name} on selected clip`}
                  >
                    <MediaThumb item={item} className="h-full w-full" />
                    <span className="absolute left-1 top-1 grid size-5 place-items-center rounded-md bg-background/80">
                      <MediaKindIcon kind={item.kind} className="size-3" />
                    </span>
                    {inUse && <span className="absolute bottom-1 left-1 rounded bg-primary px-1 font-mono text-[8px] font-bold uppercase text-primary-foreground">In use</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMedia(item)}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-md bg-background/85 text-destructive"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <NotConnectedNotice
        title="AI video generation"
        description="No AI video provider is connected, so clips are not generated automatically. Use your scene prompts in any video tool, then upload the clips here."
      />
    </div>
  );
}

function PreviewFrame({ project, scene, media, playing }: { project: Project; scene: Scene | undefined; media: MediaItem | undefined; playing: boolean }) {
  const url = useMediaUrl(media?.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rtl = project.language === "urdu";

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play().catch(() => undefined);
    else v.pause();
  }, [playing, url]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [scene?.id]);

  if (!scene) {
    return <div className="grid h-full place-items-center p-4 text-center text-xs text-muted-foreground">No clips yet</div>;
  }
  const caption = (scene.subtitle || scene.narration).trim();

  return (
    <>
      {media && url ? (
        media.kind === "video" ? (
          <video ref={videoRef} src={url} muted playsInline loop className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <img src={url} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[6000ms] ease-linear", playing && "scale-110")} />
        )
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-brand-soft p-6 text-center">
          <div>
            <p className="font-display text-sm font-semibold">{scene.title}</p>
            <p className="mt-2 line-clamp-4 text-[11px] text-muted-foreground">{scene.visual || "No media on this clip yet"}</p>
          </div>
        </div>
      )}
      {caption && (
        <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-4">
          <p
            dir={rtl ? "rtl" : "ltr"}
            className={cn(
              "max-w-[92%] rounded-lg bg-background/80 px-3 py-1.5 text-center font-semibold text-foreground backdrop-blur",
              project.aspectRatio === "16:9" ? "text-xs" : "text-sm",
              rtl && "font-urdu-text",
            )}
          >
            {caption}
          </p>
        </div>
      )}
    </>
  );
}
