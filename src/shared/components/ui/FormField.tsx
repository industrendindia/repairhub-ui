import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
