import { cn } from "@/lib/utils";
import type { AspectRatio } from "@/lib/studio/types";

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("flex gap-1 rounded-xl border border-border bg-surface p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold transition-all",
              active ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ChipGroup<T extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: React.ReactNode }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
              active
                ? "border-secondary bg-secondary/20 text-secondary-foreground glow-secondary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const ASPECT_CLASS: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "16:9": "aspect-video",
};

export function aspectClass(ratio: AspectRatio) {
  return ASPECT_CLASS[ratio];
}

export function AspectIcon({ ratio, className }: { ratio: AspectRatio; className?: string }) {
  const size = ratio === "9:16" ? "h-4 w-[9px]" : ratio === "1:1" ? "size-3.5" : "h-[9px] w-4";
  return <span className={cn("inline-block rounded-[3px] border-[1.5px] border-current", size, className)} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
