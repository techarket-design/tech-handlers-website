import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type FileItem = { url: string; name?: string };

const Ctx = createContext<{ open: (f: FileItem) => void } | null>(null);

export const useFileViewer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("FileViewerProvider missing");
  return c;
};

function extOf(u: string, name?: string) {
  const s = (name || u).split("?")[0].split("#")[0];
  return s.split(".").pop()?.toLowerCase() || "";
}

function kind(url: string, name?: string): "image" | "video" | "audio" | "pdf" | "office" | "text" | "other" {
  const e = extOf(url, name);
  if (["png","jpg","jpeg","gif","webp","svg","bmp","avif","ico"].includes(e)) return "image";
  if (["mp4","webm","mov","m4v","ogv"].includes(e)) return "video";
  if (["mp3","wav","ogg","m4a","aac","flac"].includes(e)) return "audio";
  if (e === "pdf") return "pdf";
  if (["doc","docx","xls","xlsx","ppt","pptx"].includes(e)) return "office";
  if (["txt","md","csv","json","log","xml","yaml","yml"].includes(e)) return "text";
  return "other";
}

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<FileItem | null>(null);
  const open = useCallback((f: FileItem) => setFile(f), []);
  const close = () => setFile(null);

  const k = file ? kind(file.url, file.name) : "other";
  const officeUrl = file
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(file.url)}`
    : "";

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Dialog open={!!file} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background">
            <p className="text-sm font-medium truncate">{file?.name || file?.url}</p>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" asChild>
                <a href={file?.url} download={file?.name} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={file?.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-black/90 flex items-center justify-center overflow-auto">
            {file && k === "image" && (
              <img src={file.url} alt={file.name || ""} className="max-h-full max-w-full object-contain" />
            )}
            {file && k === "video" && (
              <video src={file.url} controls autoPlay className="max-h-full max-w-full" />
            )}
            {file && k === "audio" && (
              <audio src={file.url} controls autoPlay className="w-full max-w-xl" />
            )}
            {file && k === "pdf" && (
              <iframe src={file.url} title={file.name} className="w-full h-full bg-white" />
            )}
            {file && k === "office" && (
              <iframe src={officeUrl} title={file.name} className="w-full h-full bg-white" />
            )}
            {file && (k === "text" || k === "other") && (
              <iframe src={file.url} title={file.name} className="w-full h-full bg-white" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}