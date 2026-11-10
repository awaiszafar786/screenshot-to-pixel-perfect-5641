import { Link } from "@tanstack/react-router";
import { PlugZap, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="vx-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="var(--surface-raised)" stroke="url(#vx-g)" strokeWidth="1.5" />
      <path d="M8 9.5 L16 23 L24 9.5" fill="none" stroke="url(#vx-g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="9.5" r="2" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="VEXARO AI Studio home">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[15px] font-bold tracking-tight">VEXARO</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">AI Studio</span>
        </span>
      )}
    </Link>
  );
}

export function StatusBadge({ connected, className }: { connected: boolean; className?: string }) {
  return connected ? (
    <Badge variant="connected" className={cn("gap-1", className)}>
      <span className="size-1.5 animate-pulse-glow rounded-full bg-primary" />
      Connected
    </Badge>
  ) : (
    <Badge variant="offline" className={cn("gap-1", className)}>
      <span className="size-1.5 rounded-full bg-warning" />
      Not connected
    </Badge>
  );
}

export function NotConnectedNotice({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-warning/40 bg-warning/5 p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
          <PlugZap className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <StatusBadge connected={false} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          <Link to="/providers" className="mt-2 inline-block text-xs font-semibold text-warning underline-offset-4 hover:underline">
            View AI engines →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ConnectedNote({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <CircleCheck className="size-3.5 text-primary" />
      {text}
    </p>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}
