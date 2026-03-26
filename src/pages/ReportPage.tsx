import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, FileText, Brain, Layers, Globe, AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type MatchedSource = Tables<"matched_sources">;

function CircularProgress({ value, size = 120, label, sublabel, color }: { value: number; size?: number; label: string; sublabel: string; color: string }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={6} />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  );
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

function getSublabel(score: number, type: "similarity" | "ai" | "paraphrase") {
  if (type === "similarity") return score > 25 ? "High match rate" : score > 15 ? "Moderate match" : "Low match rate";
  if (type === "ai") return score > 50 ? "High AI likelihood" : score > 20 ? "Moderate likelihood" : "Low AI likelihood";
  return score > 25 ? "High paraphrase" : score > 10 ? "Some paraphrasing" : "Minimal suspicion";
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [sources, setSources] = useState<MatchedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"originality" | "ai" | "paraphrase" | "sources">("originality");

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      const [subRes, srcRes] = await Promise.all([
        supabase.from("submissions").select("*").eq("id", id).single(),
        supabase.from("matched_sources").select("*").eq("submission_id", id).order("similarity_percentage", { ascending: false }),
      ]);

      if (subRes.data) setSubmission(subRes.data);
      if (srcRes.data) setSources(srcRes.data);
      setLoading(false);
    };

    fetchReport();
  }, [id]);

  const tabs = [
    { id: "originality" as const, label: "Originality", icon: FileText },
    { id: "ai" as const, label: "AI Detection", icon: Brain },
    { id: "paraphrase" as const, label: "Paraphrase", icon: Layers },
    { id: "sources" as const, label: "Sources", icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-24">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Report Not Found</h2>
        <p className="text-muted-foreground text-sm mb-4">This submission doesn't exist or you don't have access.</p>
        <Link to="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const similarity = submission.similarity_score ?? 0;
  const aiScore = submission.ai_score ?? 0;
  const paraphrase = submission.paraphrase_score ?? 0;

  const formattedDate = new Date(submission.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Originality Report</h1>
            <p className="text-muted-foreground text-sm">{submission.title} · Submitted {formattedDate}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={similarity} label="Similarity Score" sublabel={getSublabel(similarity, "similarity")} color="hsl(158 64% 40%)" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={aiScore} label="AI Probability" sublabel={getSublabel(aiScore, "ai")} color="hsl(38 92% 50%)" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={paraphrase} label="Paraphrase Score" sublabel={getSublabel(paraphrase, "paraphrase")} color="hsl(217 91% 60%)" />
        </motion.div>
      </div>

      {/* Status Banner */}
      {submission.status === "queued" || submission.status === "processing" ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <Loader2 className="w-5 h-5 text-warning animate-spin" />
          <div>
            <div className="text-sm font-medium text-foreground">Analysis in Progress</div>
            <div className="text-xs text-muted-foreground">Your document is being processed. Scores will update automatically.</div>
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "originality" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-panel rounded-xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Document Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">File Name</span>
                <span className="text-foreground font-medium">{submission.file_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">File Type</span>
                <span className="text-foreground font-medium uppercase">{submission.file_type || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">File Size</span>
                <span className="text-foreground font-medium">
                  {submission.file_size ? `${(submission.file_size / 1024).toFixed(0)} KB` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Submitted</span>
                <span className="text-foreground font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  submission.status === "completed" ? "bg-success/10 text-success" :
                  submission.status === "flagged" ? "bg-destructive/10 text-destructive" :
                  "bg-warning/10 text-warning"
                }`}>
                  {submission.status === "review_pending" ? "Review Pending" : submission.status}
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" /> Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  {similarity <= 25 ? (
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  )}
                  <span className="text-muted-foreground">
                    Similarity score is {similarity <= 25 ? "within acceptable range" : "above recommended threshold"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  {aiScore <= 30 ? (
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  )}
                  <span className="text-muted-foreground">
                    AI detection shows {aiScore <= 30 ? "low" : aiScore <= 60 ? "moderate" : "high"} probability of generated content
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{sources.length} matched source{sources.length !== 1 ? "s" : ""} identified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-panel rounded-xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">AI Analysis</h3>
            <div className="space-y-4">
              <ConfidenceBar label="Human-written likelihood" value={Math.max(0, 100 - aiScore)} color="hsl(158 64% 40%)" />
              <ConfidenceBar label="AI-generated probability" value={aiScore} color="hsl(38 92% 50%)" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-3">Detection Verdict</h3>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                aiScore <= 30 ? "bg-success/10 border-success/20" :
                aiScore <= 60 ? "bg-warning/10 border-warning/20" :
                "bg-destructive/10 border-destructive/20"
              }`}>
                {aiScore <= 30 ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                )}
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {submission.ai_likelihood ? submission.ai_likelihood.charAt(0).toUpperCase() + submission.ai_likelihood.slice(1) : aiScore <= 30 ? "Low" : aiScore <= 60 ? "Moderate" : "High"} AI Likelihood
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {aiScore <= 30 ? "Content appears primarily human-written" :
                     aiScore <= 60 ? "Some sections may contain AI-generated content" :
                     "Content likely contains significant AI-generated portions"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "paraphrase" && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Paraphrase Analysis</h3>
          <div className="space-y-4">
            <ConfidenceBar label="Paraphrase Score" value={paraphrase} color="hsl(217 91% 60%)" />
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            {paraphrase <= 10
              ? "No significant paraphrasing patterns detected in this document."
              : paraphrase <= 30
              ? "Some paraphrasing patterns detected. Review matched sources for details."
              : "Significant paraphrasing patterns detected. Manual review recommended."}
          </p>
        </div>
      )}

      {activeTab === "sources" && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Matched Sources</h3>
            <p className="text-sm text-muted-foreground mt-1">{sources.length} source{sources.length !== 1 ? "s" : ""} identified</p>
          </div>
          {sources.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No matched sources found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sources.map((source) => (
                <div key={source.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{source.source_title}</div>
                      <div className="text-xs text-muted-foreground">{source.source_url || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      source.source_type === "academic" ? "bg-accent/10 text-accent" :
                      source.source_type === "journal" ? "bg-info/10 text-info" :
                      source.source_type === "web" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {source.source_type}
                    </span>
                    <span className="text-sm font-medium text-foreground">{source.similarity_percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
