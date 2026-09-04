import { usePendingUploads, resumeUpload, cancelUpload } from "@/hooks/useResumableUpload";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X, Loader2 } from "lucide-react";

export function UploadResumeBanner() {
  const { items } = usePendingUploads();
  if (!items.length) return null;

  const uploading = items.filter(i => i.status === "uploading");
  const stalled = items.filter(i => i.status === "queued" || i.status === "error");

  return (
    <div className="border-b border-border bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs flex items-center gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-amber-900 dark:text-amber-100">
          {uploading.length > 0 && `${uploading.length} uploading · `}
          {stalled.length > 0 && `${stalled.length} pending`}
        </span>
        <span className="text-amber-800/70 dark:text-amber-200/70 ml-2 truncate">
          {items.slice(0, 2).map(i => i.fileName).join(", ")}
          {items.length > 2 && ` +${items.length - 2} more`}
        </span>
      </div>
      <div className="flex gap-1">
        {stalled.map(i => (
          <div key={i.id} className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => resumeUpload(i.id)}>
              <RefreshCw className="h-3 w-3 mr-1" /> Resume
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
              onClick={() => cancelUpload(i.id)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {uploading.length > 0 && <Loader2 className="h-3 w-3 animate-spin text-amber-700" />}
      </div>
    </div>
  );
}