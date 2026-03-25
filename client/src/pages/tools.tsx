import { useState, useRef, useCallback } from "react";
import { Cpu, Wand2, ImageIcon, Copy, Check, Upload, X, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


interface UploadedImage {
  id: string;
  url: string;
  name: string;
  preview: string;
}

function ImageURLCreator() {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ url: string; filename: string; originalName: string }>;
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const imageFiles = fileArr.filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast({ title: "Please upload image files only", variant: "destructive" });
      return;
    }

    setUploading(true);
    for (const file of imageFiles) {
      try {
        const preview = URL.createObjectURL(file);
        const result = await uploadFile(file);
        setImages(prev => [{
          id: result.filename,
          url: result.url,
          name: file.name,
          preview,
        }, ...prev]);
      } catch {
        toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
      }
    }
    setUploading(false);
    toast({ title: `${imageFiles.length} image${imageFiles.length > 1 ? "s" : ""} uploaded!` });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const copyUrl = (id: string, url: string) => {
    // Make absolute for sharing — relative paths aren't usable outside this tab
    const absolute = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(absolute);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "URL copied to clipboard!" });
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-6">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        data-testid="drop-zone"
        className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-white/10 hover:border-primary/50 hover:bg-white/[0.02] bg-white/[0.01]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
          data-testid="input-file-upload"
        />

        {uploading ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-white font-bold text-lg">Uploading...</p>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all ${
              dragging ? "bg-primary/30 border-primary/50" : "bg-primary/10 border-primary/20"
            }`}>
              <ImageIcon className={`w-8 h-8 transition-colors ${dragging ? "text-primary" : "text-primary/70"}`} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xl mb-1">Drop images or GIFs here</p>
              <p className="text-muted-foreground text-sm">or click to browse — supports PNG, JPG, GIF, WebP, SVG</p>
            </div>
            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Upload className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-semibold">Upload & Get URL</span>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Link className="w-4 h-4" /> Generated URLs ({images.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {images.map(img => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  data-testid={`card-image-${img.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate mb-1">{img.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{img.url}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 border-white/10 hover:bg-primary/10 hover:border-primary/50"
                      onClick={() => copyUrl(img.id, img.url)}
                      data-testid={`button-copy-${img.id}`}
                    >
                      {copiedId === img.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(img.id)}
                      data-testid={`button-remove-${img.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Tools() {
  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-10">
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-12 text-gradient-animated tracking-widest uppercase text-center">
          Media / Tools
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-white/[0.03] border-white/10 hover:border-primary/50 transition-all group overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl text-white font-display tracking-widest">Humanizer AI</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Advanced text bypass and humanization engine</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button
                  className="w-full bg-primary text-white font-bold h-14 rounded-2xl text-lg hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
                  onClick={() => window.open("https://humanize-text-bypass--nkchknc.replit.app/", '_blank')}
                  data-testid="button-launch-humanizer"
                >
                  Launch Humanizer
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-white/[0.03] border-white/10 hover:border-primary/50 transition-all group overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <Cpu className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl text-white font-display tracking-widest">More Tools</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">More tools coming soon to the Horizon platform</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="w-full h-14 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-muted-foreground text-sm">
                  Coming soon
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl text-white font-display tracking-widest">Image URL Creator</CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">Upload any image or GIF and get a shareable URL instantly</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ImageURLCreator />
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
