import { Download, Maximize2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/Button";

type ImageViewerProps = {
  src: string;
  alt: string;
};

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="group relative overflow-hidden rounded-md border" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} className="aspect-video w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/30">
          <Maximize2 className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button asChild variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />}>
              <a href={src} download>
                Download
              </a>
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setOpen(false)} aria-label="Close image viewer">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <img src={src} alt={alt} className="max-h-full max-w-full rounded-md object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
