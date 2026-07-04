import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
};

export function Modal({ open, title, description, children, onClose, footer, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className={cn("w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-soft", className)}>
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
