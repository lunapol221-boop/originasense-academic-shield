import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FileItem {
  id: string;
  file: File;
  status: "queued" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  submissionId?: string;
  errorMessage?: string;
}

export default function SubmitPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const updateFile = (id: string, updates: Partial<FileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const uploadFile = async (item: FileItem) => {
    if (!user) return;

    updateFile(item.id, { status: "uploading", progress: 20 });

    try {
      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${item.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("submissions")
        .upload(filePath, item.file);

      if (uploadError) {
        // If bucket doesn't exist, still create the record without file_url
        console.warn("Storage upload failed, creating record without file:", uploadError.message);
      }

      updateFile(item.id, { progress: 60, status: "processing" });

      // Create submission record
      const { data, error: insertError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          title: item.file.name.replace(/\.[^/.]+$/, ""),
          file_name: item.file.name,
          file_size: item.file.size,
          file_type: item.file.type || item.file.name.split(".").pop() || "unknown",
          file_url: uploadError ? null : filePath,
          status: "queued",
          institution_id: user.profile?.institution_id || null,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      updateFile(item.id, {
        status: "processing",
        progress: 80,
        submissionId: data.id,
      });

      // Trigger AI analysis
      try {
        const { error: analyzeError } = await supabase.functions.invoke("analyze-document", {
          body: { submission_id: data.id },
        });
        if (analyzeError) {
          console.warn("Analysis error:", analyzeError);
          toast.warning(`${item.file.name} uploaded but analysis failed. You can retry later.`);
        }
      } catch (analyzeErr) {
        console.warn("Analysis invocation failed:", analyzeErr);
      }

      updateFile(item.id, {
        status: "completed",
        progress: 100,
        submissionId: data.id,
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      updateFile(item.id, {
        status: "error",
        errorMessage: err.message || "Upload failed",
      });
      toast.error(`Failed to upload ${item.file.name}`);
    }
  };

  const addFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: FileItem[] = Array.from(fileList).map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        status: "queued" as const,
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);

      // Process files sequentially with a small delay
      newFiles.forEach((item, i) => {
        setTimeout(() => uploadFile(item), i * 300);
      });
    },
    [user]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "uploading":
      case "processing":
        return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const completedFiles = files.filter((f) => f.status === "completed");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Submit Document</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload files for originality and AI analysis
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-panel rounded-xl p-12 text-center border-2 border-dashed transition-colors cursor-pointer ${
          dragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".pdf,.docx,.txt";
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) addFiles(files);
          };
          input.click();
        }}
      >
        <Upload className="w-10 h-10 text-accent mx-auto mb-4" />
        <p className="font-display font-semibold text-foreground mb-1">
          Drop files here or click to upload
        </p>
        <p className="text-sm text-muted-foreground">
          Supports PDF, DOCX, TXT — up to 50MB per file
        </p>
      </motion.div>

      {files.length > 0 && (
        <div className="glass-panel rounded-xl divide-y divide-border overflow-hidden">
          {files.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              {statusIcon(item.status)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {item.file.name}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {item.status === "error" ? item.errorMessage : item.status} ·{" "}
                  {(item.file.size / 1024).toFixed(0)} KB
                </div>
                {(item.status === "uploading" || item.status === "processing") && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(item.id);
                }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {completedFiles.length > 0 && (
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            View Dashboard
          </Button>
          {completedFiles.length === 1 && completedFiles[0].submissionId && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/dashboard/report/${completedFiles[0].submissionId}`)
              }
            >
              View Report
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
