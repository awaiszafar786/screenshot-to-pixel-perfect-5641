import { Link } from "@tanstack/react-router";
import { Cpu, FolderKanban } from "lucide-react";

import { Logo } from "@/components/studio/brand";
import { cn } from "@/lib/utils";

/** Top bar + bottom tab bar for the app's top-level pages. */
export function AppChrome({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-page">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Logo />
          {action}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">{children}</main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 backdrop-blur-xl pb-safe">
        <div className="mx-auto grid max-w-3xl grid-cols-2 px-6 pt-2">
          <TabLink to="/" icon={<FolderKanban />} label="Projects" exact />
          <TabLink to="/providers" icon={<Cpu />} label="AI Engines" />
        </div>
      </nav>
    </div>
  );
}

function TabLink({ to, icon, label, exact }: { to: "/" | "/providers"; icon: React.ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: Boolean(exact) }}
      className="group flex flex-col items-center gap-1 py-1.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span className={cn("grid h-8 w-14 place-items-center rounded-full transition-all [&_svg]:size-5", isActive && "bg-primary/15")}>{icon}</span>
          <span className="text-[11px] font-semibold">{label}</span>
        </>
      )}
    </Link>
  );
}
