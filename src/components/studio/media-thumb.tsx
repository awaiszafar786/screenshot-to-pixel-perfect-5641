import { Film, ImageIcon, Music } from "lucide-react";

import { useMediaUrl } from "@/lib/studio/media-db";
import type { MediaItem } from "@/lib/studio/types";
import { cn } from "@/lib/utils";

export function MediaThumb({ item, className, controls = false }: { item: MediaItem | undefined; className?: string; controls?: boolean }) {
  const url = useMediaUrl(item?.id);
  if (!item) {
    return (
      <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
        <ImageIcon className="size-5 opacity-50" />
      </div>
    );
  }
  if (!url) return <div className={cn("animate-pulse bg-muted", className)} />;
  if (item.kind === "image") return <img src={url} alt={item.name} className={cn("object-cover", className)} />;
  if (item.kind === "video")
    return <video src={url} muted playsInline preload="metadata" controls={controls} className={cn("object-cover", className)} />;
  return (
    <div className={cn("grid place-items-center bg-muted text-muted-foreground", className)}>
      <Music className="size-5" />
    </div>
  );
}

export function MediaKindIcon({ kind, className }: { kind: MediaItem["kind"]; className?: string }) {
  if (kind === "video") return <Film className={className} />;
  if (kind === "audio") return <Music className={className} />;
  return <ImageIcon className={className} />;
}
