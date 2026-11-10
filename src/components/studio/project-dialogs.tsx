import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectIcon, ChipGroup, Field, Segmented } from "@/components/studio/controls";
import { projectActions } from "@/lib/studio/store";
import { ASPECT_RATIOS, LANGUAGE_LABELS, type AspectRatio, type ScriptLanguage } from "@/lib/studio/types";

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<ScriptLanguage>("english");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const project = projectActions.create({ name, description, language, aspectRatio });
    onOpenChange(false);
    toast.success("Project created");
    navigate({ to: "/projects/$projectId/script", params: { projectId: project.id } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-3xl border-border bg-popover sm:max-w-md">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl">New video project</DialogTitle>
            <DialogDescription>You can change all of this later.</DialogDescription>
          </DialogHeader>
          <Field label="Project name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramadan recipe series" maxLength={80} className="h-11 rounded-xl" />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this video about?" rows={2} maxLength={300} className="rounded-xl" />
          </Field>
          <Field label="Script language">
            <ChipGroup
              ariaLabel="Script language"
              value={language}
              onChange={setLanguage}
              options={(Object.keys(LANGUAGE_LABELS) as ScriptLanguage[]).map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
            />
          </Field>
          <Field label="Format">
            <Segmented
              ariaLabel="Video format"
              value={aspectRatio}
              onChange={setAspectRatio}
              options={ASPECT_RATIOS.map((r) => ({
                value: r.value,
                label: (
                  <span className="flex items-center justify-center gap-1.5">
                    <AspectIcon ratio={r.value} /> {r.value}
                  </span>
                ),
              }))}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="hero" size="lg" className="w-full">
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RenameProjectDialog({
  projectId,
  currentName,
  open,
  onOpenChange,
}: {
  projectId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [name, setName] = useState(currentName);
  useEffect(() => {
    if (open) setName(currentName);
  }, [open, currentName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border bg-popover sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            projectActions.rename(projectId, name);
            onOpenChange(false);
            toast.success("Project renamed");
          }}
          className="space-y-5"
        >
          <DialogHeader className="text-left">
            <DialogTitle className="font-display">Rename project</DialogTitle>
          </DialogHeader>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-11 rounded-xl" aria-label="Project name" />
          <DialogFooter className="gap-2">
            <Button type="submit" variant="glow" className="w-full">
              Save name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
