import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, FileAudio, Mic, Square, Trash2, Upload, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { NotConnectedNotice, SectionLabel, StatusBadge } from "@/components/studio/brand";
import { Segmented } from "@/components/studio/controls";
import { useCurrentProject } from "@/components/studio/project-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isConnected } from "@/lib/ai/providers";
import { downloadBlob } from "@/lib/studio/exporters";
import { deleteMediaFile, formatBytes, getMediaBlob, saveMediaFile, useMediaUrl } from "@/lib/studio/media-db";
import type { VoiceLanguage } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$projectId/voice")({
  head: () => ({
    meta: [
      { title: "Voiceover Studio — VEXARO AI Studio" },
      { name: "description", content: "Prepare Urdu and English voiceover text and upload your own recording." },
      { property: "og:title", content: "Voiceover Studio — VEXARO AI Studio" },
      { property: "og:description", content: "Prepare Urdu and English voiceover text and upload your own recording." },
    ],
  }),
  component: VoicePage,
});

function VoicePage() {
  const { project, update } = useCurrentProject();
  const voice = project.voiceover;
  const fileRef = useRef<HTMLInputElement>(null);
  const audioItem = project.media.find((m) => m.id === voice.audioMediaId);
  const audioUrl = useMediaUrl(voice.audioMediaId);
  const rtl = voice.language === "urdu";
  const aiVoiceReady = isConnected("voice");

  const setVoice = (patch: Partial<typeof voice>) => update((p) => ({ voiceover: { ...p.voiceover, ...patch } }));

  const words = voice.text.trim() ? voice.text.trim().split(/\s+/).length : 0;
  const estSeconds = Math.round(words / (voice.language === "english" ? 2.5 : 2.2));

  const fillFromScenes = () => {
    const text = project.scenes.map((s) => s.narration.trim()).filter(Boolean).join("\n\n");
    if (!text) return void toast.error("Your storyboard has no narration yet.");
    if (voice.text.trim() && !window.confirm("Replace the current voiceover text?")) return;
    setVoice({ text });
  };
  const fillFromScript = () => {
    const text = project.script.body.trim();
    if (!text) return void toast.error("Your script is empty.");
    if (voice.text.trim() && !window.confirm("Replace the current voiceover text?")) return;
    setVoice({ text });
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Please choose an audio file (MP3, WAV, M4A…).");
      return;
    }
    try {
      const item = await saveMediaFile(file);
      const previous = voice.audioMediaId;
      update((p) => ({
        media: [...p.media.filter((m) => m.id !== previous), item],
        voiceover: { ...p.voiceover, audioMediaId: item.id },
      }));
      if (previous) deleteMediaFile(previous).catch(() => undefined);
      toast.success("Voiceover uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAudio = async () => {
    const id = voice.audioMediaId;
    if (!id) return;
    update((p) => ({ media: p.media.filter((m) => m.id !== id), voiceover: { ...p.voiceover, audioMediaId: null } }));
    await deleteMediaFile(id).catch(() => undefined);
  };

  const downloadAudio = async () => {
    if (!voice.audioMediaId) return;
    const file = await getMediaBlob(voice.audioMediaId);
    if (file) downloadBlob(file.blob, file.name);
  };

  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Step 03</SectionLabel>
        <h1 className="mt-1 text-2xl font-bold">Voiceover Studio</h1>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Voiceover text</SectionLabel>
          <span className="font-mono text-[10px] text-muted-foreground">
            {words} words · ~{estSeconds}s
          </span>
        </div>
        <Segmented<VoiceLanguage>
          ariaLabel="Voiceover language"
          value={voice.language}
          onChange={(language) => setVoice({ language })}
          options={[
            { value: "urdu", label: "اردو Urdu" },
            { value: "english", label: "English" },
          ]}
        />
        <Textarea
          dir={rtl ? "rtl" : "ltr"}
          value={voice.text}
          onChange={(e) => setVoice({ text: e.target.value })}
          rows={10}
          placeholder={rtl ? "یہاں وائس اوور کا متن لکھیں…" : "Write or paste the text your narrator will read…"}
          className={cn("rounded-xl bg-surface", rtl ? "font-urdu-text text-base" : "text-[15px] leading-relaxed")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="surface" size="sm" onClick={fillFromScenes} disabled={!project.scenes.length}>
            Use scene narration
          </Button>
          <Button variant="surface" size="sm" onClick={fillFromScript} disabled={!project.script.body.trim()}>
            Use full script
          </Button>
        </div>
        <DevicePreview text={voice.text} language={voice.language} />
      </section>

      <section className="space-y-3">
        <SectionLabel>Your recording</SectionLabel>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        {audioItem ? (
          <div className="panel space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <FileAudio className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{audioItem.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(audioItem.size)}</p>
              </div>
            </div>
            {audioUrl && <audio src={audioUrl} controls className="w-full" />}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="surface" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload /> Replace
              </Button>
              <Button variant="surface" size="sm" onClick={downloadAudio}>
                <Download /> Save
              </Button>
              <Button variant="surface" size="sm" className="text-destructive" onClick={removeAudio}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="panel bg-grid flex w-full flex-col items-center gap-2 border-dashed px-6 py-8 text-center transition-colors hover:border-primary/50"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-brand-soft text-primary">
              <Mic className="size-5" />
            </span>
            <span className="text-sm font-semibold">Upload voiceover audio</span>
            <span className="text-xs text-muted-foreground">MP3, WAV or M4A recorded on your phone or in any app</span>
          </button>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionLabel>AI voice</SectionLabel>
          <StatusBadge connected={aiVoiceReady} />
        </div>
        <NotConnectedNotice
          title="AI voiceover generation"
          description="No AI voice provider is connected yet, so VEXARO will not generate speech. Your text is saved and ready — once a provider (e.g. an open-source Urdu/English TTS) is added, it will appear here."
        />
        <Button variant="surface" size="lg" className="w-full" disabled>
          <Volume2 /> Generate AI voiceover — Not connected
        </Button>
      </section>

      <Button asChild variant="violet" size="lg" className="w-full">
        <Link to="/projects/$projectId/workspace" params={{ projectId: project.id }}>
          Open video workspace <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

/** Reads the text aloud with the phone/browser's built-in voice so you can check timing. Not an AI provider. */
function DevicePreview({ text, language }: { text: string; language: VoiceLanguage }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    if (!text.trim()) return void toast.error("Add some voiceover text first.");
    const utter = new SpeechSynthesisUtterance(text);
    const lang = language === "urdu" ? "ur" : "en";
    utter.lang = language === "urdu" ? "ur-PK" : "en-US";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) utter.voice = voice;
    else if (language === "urdu") toast.message("Your device has no Urdu voice installed — the preview may sound wrong.");
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    synth.speak(utter);
    setSpeaking(true);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[11px] leading-snug text-muted-foreground">Timing check with your device's built-in voice (not AI).</p>
      <Button variant="ghost" size="sm" onClick={toggle}>
        {speaking ? <Square /> : <Volume2 />} {speaking ? "Stop" : "Listen"}
      </Button>
    </div>
  );
}
