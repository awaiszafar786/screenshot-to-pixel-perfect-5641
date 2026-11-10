import { createFileRoute } from "@tanstack/react-router";
import { AudioLines, Clapperboard, Image as ImageIcon, LayoutPanelTop, PenLine } from "lucide-react";

import { AppChrome } from "@/components/studio/app-chrome";
import { SectionLabel, StatusBadge } from "@/components/studio/brand";
import { PROVIDERS, type Capability } from "@/lib/ai/providers";

export const Route = createFileRoute("/providers")({
  head: () => ({
    meta: [
      { title: "AI Engines — VEXARO AI Studio" },
      { name: "description", content: "See which AI engines power VEXARO: script writing and storyboards are live, voice and video slots are ready for future providers." },
      { property: "og:title", content: "AI Engines — VEXARO AI Studio" },
      { property: "og:description", content: "Connected and upcoming AI engines for scripts, storyboards, voiceover and video." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvidersPage,
});

const ICONS: Record<Capability, React.ReactNode> = {
  script: <PenLine />,
  storyboard: <LayoutPanelTop />,
  voice: <AudioLines />,
  video: <Clapperboard />,
  image: <ImageIcon />,
};

function ProvidersPage() {
  const live = PROVIDERS.filter((p) => p.status === "connected");
  const slots = PROVIDERS.filter((p) => p.status !== "connected");
  return (
    <AppChrome>
      <SectionLabel>Integrations</SectionLabel>
      <h1 className="mt-1 text-2xl font-bold">AI Engines</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        VEXARO only shows AI features that really work. Engines marked <span className="font-semibold text-warning">Not connected</span> have a ready slot but no provider yet — nothing is simulated.
      </p>

      <h2 className="mt-7 mb-3 text-sm font-semibold">Live now</h2>
      <ul className="space-y-3">
        {live.map((p) => (
          <ProviderRow key={p.id} provider={p} />
        ))}
      </ul>

      <h2 className="mt-7 mb-3 text-sm font-semibold">Ready for a provider</h2>
      <ul className="space-y-3">
        {slots.map((p) => (
          <ProviderRow key={p.id} provider={p} />
        ))}
      </ul>

      <div className="panel mt-7 p-4">
        <p className="text-sm font-semibold">Works without these engines</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Until voice and video engines are connected, you can upload your own recordings, photos and clips, arrange them on the timeline, edit subtitles and download your script, subtitles and prompts to use in any tool.
        </p>
      </div>
    </AppChrome>
  );
}

function ProviderRow({ provider }: { provider: (typeof PROVIDERS)[number] }) {
  const connected = provider.status === "connected";
  return (
    <li className="panel p-4">
      <div className="flex items-start gap-3">
        <div
          className={
            connected
              ? "grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary [&_svg]:size-5"
              : "grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning [&_svg]:size-5"
          }
        >
          {ICONS[provider.capability]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{provider.name}</p>
            <StatusBadge connected={connected} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{provider.description}</p>
          {!connected && provider.candidates.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              <span className="text-foreground/80">Can connect later:</span> {provider.candidates.join(" · ")}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
