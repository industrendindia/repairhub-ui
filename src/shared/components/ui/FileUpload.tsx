import { UploadCloud, X } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type FileUploadProps = {
  label?: string;
  accept?: string;
  capture?: boolean | "user" | "environment";
  multiple?: boolean;
  maxFileSizeBytes?: number;
  onFilesChange?: (files: File[]) => void;
};

export function FileUpload({
  label = "Upload files",
  accept,
  capture,
  multiple,
  maxFileSizeBytes,
  onFilesChange,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    const oversizedFiles = maxFileSizeBytes
      ? nextFiles.filter((file) => file.size > maxFileSizeBytes)
      : [];

    if (oversizedFiles.length > 0) {
      const names = oversizedFiles.map((file) => file.name).join(", ");
      setFiles([]);
      setError(`${names}: each image must be 1 MB or smaller.`);
      event.target.value = "";
      onFilesChange?.([]);
      return;
    }

    setError("");
    setFiles(nextFiles);
    onFilesChange?.(nextFiles);
  };

  const clearFiles = () => {
    setFiles([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onFilesChange?.([]);
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-card px-4 py-6 text-center transition-colors hover:bg-muted/60"
        )}
      >
        <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        <span className="mt-1 text-xs text-muted-foreground">
          Choose from your device{maxFileSizeBytes ? " · Maximum 1 MB per image" : ""}
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        capture={capture}
        multiple={multiple}
        className="sr-only"
        onChange={handleChange}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {files.length > 0 ? (
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{files.length} selected</p>
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearFiles}>
              Clear
            </Button>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
