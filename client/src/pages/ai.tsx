import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, X, Bot, User, Sparkles, ImageIcon, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";


interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "document";
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string }[];
  timestamp: Date;
  isStreaming?: boolean;
}

function FilePreview({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  return (
    <div className="relative group flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 max-w-[180px]">
      {file.type === "image" && file.preview ? (
        <img src={file.preview} alt={file.file.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
      )}
      <span className="text-xs text-white/70 truncate">{file.file.name}</span>
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
      >
        <X className="w-2.5 h-2.5 text-white" />
      </button>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  const formatContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const lang = lines[0].trim();
        const code = lines.slice(1).join("\n");
        return (
          <pre key={i} className="my-3 rounded-xl overflow-auto bg-black/60 border border-white/10 p-4 text-sm font-mono text-green-300">
            {lang && <div className="text-xs text-white/40 mb-2 uppercase tracking-widest">{lang}</div>}
            {code}
          </pre>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-primary text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} group`}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
        isUser
          ? "bg-primary/20 border-primary/30"
          : "bg-white/5 border-white/10"
      }`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-white/70" />}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.files && msg.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {msg.files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/60">
                {f.type.startsWith("image") ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                {f.name}
              </div>
            ))}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/15 border border-primary/20 text-white"
            : "bg-white/[0.04] border border-white/10 text-white/90"
        }`}>
          {msg.isStreaming ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-white/50 text-xs">Thinking...</span>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{formatContent(msg.content)}</div>
          )}
        </div>

        <span className="text-[10px] text-white/20 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Horizon AI — powered by advanced vision and language models. I can help you with questions, analyze images, solve math problems, explain documents, and much more.\n\nAttach any file or photo and I'll use it to give you the best answer. What can I help you with today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newFiles: AttachedFile[] = arr.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      type: f.type.startsWith("image/") ? "image" : "document",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (loading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: input.trim() || (attachedFiles.length > 0 ? "What do you see in these files?" : ""),
      files: attachedFiles.map(f => ({ name: f.file.name, type: f.file.type })),
      timestamp: new Date(),
    };

    const thinkingMsg: Message = {
      id: "thinking-" + Date.now(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setInput("");
    const currentFiles = [...attachedFiles];
    setAttachedFiles([]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", userMsg.content);
      currentFiles.forEach(f => formData.append("files", f.file));

      const res = await fetch("/api/ai/chat", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "AI request failed");

      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, content: data.response, isStreaming: false }
          : m
      ));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));
      toast({ title: err.message || "Failed to get response", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-3 bg-black/80 backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-black text-xl text-gradient-animated tracking-widest uppercase">HORIZON AI</h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase">Intelligence Unleashed</p>
        </div>
      </div>

      <div
        className="flex flex-col flex-1 overflow-hidden relative"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary/50 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-white font-bold text-xl">Drop files here</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-6">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/5 p-4 space-y-3">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map(f => (
                <FilePreview key={f.id} file={f} onRemove={() => setAttachedFiles(prev => prev.filter(x => x.id !== f.id))} />
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end bg-white/[0.03] border border-white/10 rounded-2xl p-2 focus-within:border-primary/40 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json,.md"
              className="hidden"
              onChange={e => e.target.files && addFiles(e.target.files)}
              data-testid="input-ai-file"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white shrink-0 h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-attach-files"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything — or drop files & images to analyze them..."
              className="bg-transparent border-none focus-visible:ring-0 resize-none min-h-[44px] max-h-36 text-base text-white placeholder:text-white/30"
              rows={1}
              disabled={loading}
              data-testid="input-ai-message"
            />

            <Button
              type="button"
              size="icon"
              className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 shrink-0 h-9 w-9"
              onClick={sendMessage}
              disabled={loading || (!input.trim() && attachedFiles.length === 0)}
              data-testid="button-send-ai"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>

          <p className="text-center text-[10px] text-white/20">
            Horizon AI · Supports images, PDFs, text files, and more · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
