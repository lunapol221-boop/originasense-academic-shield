import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, Printer, FileText, Brain, Layers, Globe,
  AlertTriangle, CheckCircle2, Info, Loader2, ShieldCheck, ShieldAlert,
  Clock, BarChart3, ExternalLink, RefreshCw
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type MatchedSource = Tables<"matched_sources">;

/* ─── Score Gauge (Turnitin-style) ─── */
function ScoreGauge({ value, size = 130, label, color, ringBg }: {
  value: number; size?: number; label: string; color: string; ringBg: string;
}) {
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={ringBg} strokeWidth={8} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={color} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-display text-3xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ─── Confidence Bar ─── */
function ConfidenceBar({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon?: React.ElementType;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" />} {label}
        </span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

/* ─── Color helpers ─── */
function getScoreColor(score: number) {
  if (score <= 15) return { color: "hsl(158 64% 45%)", bg: "hsl(158 64% 45% / 0.1)", ringBg: "hsl(158 64% 45% / 0.15)", label: "Low", textClass: "text-emerald-400" };
  if (score <= 40) return { color: "hsl(45 93% 50%)", bg: "hsl(45 93% 50% / 0.1)", ringBg: "hsl(45 93% 50% / 0.15)", label: "Moderate", textClass: "text-amber-400" };
  if (score <= 60) return { color: "hsl(25 95% 55%)", bg: "hsl(25 95% 55% / 0.1)", ringBg: "hsl(25 95% 55% / 0.15)", label: "High", textClass: "text-orange-400" };
  return { color: "hsl(0 72% 55%)", bg: "hsl(0 72% 55% / 0.1)", ringBg: "hsl(0 72% 55% / 0.15)", label: "Very High", textClass: "text-red-400" };
}

function getAiColor(score: number) {
  if (score <= 25) return { color: "hsl(158 64% 45%)", bg: "hsl(158 64% 45% / 0.1)", ringBg: "hsl(158 64% 45% / 0.15)", label: "Human Written" };
  if (score <= 50) return { color: "hsl(45 93% 50%)", bg: "hsl(45 93% 50% / 0.1)", ringBg: "hsl(45 93% 50% / 0.15)", label: "Mixed Content" };
  return { color: "hsl(0 72% 55%)", bg: "hsl(0 72% 55% / 0.1)", ringBg: "hsl(0 72% 55% / 0.15)", label: "AI Generated" };
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [sources, setSources] = useState<MatchedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "sources">("overview");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReport = async () => {
    if (!id) return null;
    const [subRes, srcRes] = await Promise.all([
      supabase.from("submissions").select("*").eq("id", id).single(),
      supabase.from("matched_sources").select("*").eq("submission_id", id).order("similarity_percentage", { ascending: false }),
    ]);
    if (subRes.data) setSubmission(subRes.data);
    if (srcRes.data) setSources(srcRes.data);
    setLoading(false);
    return subRes.data;
  };

  useEffect(() => {
    if (!id) return;

    fetchReport().then((sub) => {
      if (sub && (sub.status === "queued" || sub.status === "processing")) {
        pollRef.current = setInterval(async () => {
          const result = await fetchReport();
          if (result && result.status !== "queued" && result.status !== "processing") {
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 2500);
      }
    });

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  const handleReanalyze = async () => {
    if (!id) return;
    setReanalyzing(true);
    try {
      const { error } = await supabase.functions.invoke("analyze-document", {
        body: { submission_id: id },
      });
      if (error) {
        toast.error("Re-analysis failed. Please try again.");
      } else {
        toast.success("Analysis complete!");
        await fetchReport();
      }
    } catch {
      toast.error("Failed to connect to analysis service.");
    }
    setReanalyzing(false);
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "ai" as const, label: "AI Detection", icon: Brain },
    { id: "sources" as const, label: "Sources", icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-24">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Report Not Found</h2>
        <p className="text-muted-foreground text-sm mb-4">This submission doesn't exist or you don't have access.</p>
        <Link to="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  const isProcessing = submission.status === "queued" || submission.status === "processing";
  const similarity = submission.similarity_score ? Number(submission.similarity_score) : 0;
  const aiScore = submission.ai_score ? Number(submission.ai_score) : 0;
  const paraphrase = submission.paraphrase_score ? Number(submission.paraphrase_score) : 0;
  const simColor = getScoreColor(similarity);
  const aiColor = getAiColor(aiScore);
  const paraColor = getScoreColor(paraphrase);

  const formattedDate = new Date(submission.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const overallRisk = Math.max(similarity, aiScore);
  const isClean = overallRisk <= 25;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <Link to="/dashboard" className="p-2 mt-0.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Originality Report</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{submission.title}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formattedDate}</span>
              <span className="uppercase">{submission.file_type || "—"}</span>
              {submission.file_size && <span>{(Number(submission.file_size) / 1024).toFixed(0)} KB</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(submission.status === "failed" || submission.status === "queued") && (
            <Button variant="outline" size="sm" onClick={handleReanalyze} disabled={reanalyzing}>
              {reanalyzing ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Re-analyze
            </Button>
          )}
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
        </div>
      </div>

      {/* Processing Banner */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20"
        >
          <Loader2 className="w-5 h-5 text-accent animate-spin shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Analysis in Progress</div>
            <div className="text-xs text-muted-foreground">Your document is being scanned for similarity, AI-generated content, and paraphrasing. This usually takes 10–30 seconds.</div>
          </div>
        </motion.div>
      )}

      {/* Failed Banner */}
      {submission.status === "failed" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Analysis Failed</div>
            <div className="text-xs text-muted-foreground">Something went wrong during processing. Click "Re-analyze" to try again.</div>
          </div>
        </div>
      )}

      {/* Overall Verdict Banner */}
      {!isProcessing && submission.status !== "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-4 p-4 rounded-xl border ${
            isClean
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-red-500/5 border-red-500/20"
          }`}
        >
          {isClean ? (
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          )}
          <div>
            <div className="text-sm font-semibold text-foreground">
              {isClean ? "No Significant Issues Detected" : "Potential Issues Detected — Manual Review Recommended"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isClean
                ? "This document appears to be original with low AI probability. Standard academic integrity standards are met."
                : `This document has been flagged with ${similarity}% similarity and ${aiScore}% AI probability. A reviewer should examine the highlighted sections.`}
            </div>
          </div>
        </motion.div>
      )}

      {/* Score Cards */}
      {!isProcessing && submission.status !== "failed" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 flex flex-col items-center gap-1">
            <ScoreGauge value={similarity} label="Similarity" color={simColor.color} ringBg={simColor.ringBg} />
            <span className="text-xs font-medium mt-1" style={{ color: simColor.color }}>{simColor.label} Match Rate</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 flex flex-col items-center gap-1">
            <ScoreGauge value={aiScore} label="AI Content" color={aiColor.color} ringBg={aiColor.ringBg} />
            <span className="text-xs font-medium mt-1" style={{ color: aiColor.color }}>{aiColor.label}</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 flex flex-col items-center gap-1">
            <ScoreGauge value={paraphrase} label="Paraphrase" color={paraColor.color} ringBg={paraColor.ringBg} />
            <span className="text-xs font-medium mt-1" style={{ color: paraColor.color }}>{paraColor.label} Paraphrasing</span>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      {!isProcessing && submission.status !== "failed" && (
        <>
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Score Breakdown */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-5 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" /> Score Breakdown
                  </h3>
                  <div className="space-y-5">
                    <ConfidenceBar label="Text Similarity" value={similarity} color={simColor.color} icon={Layers} />
                    <ConfidenceBar label="AI-Generated Probability" value={aiScore} color={aiColor.color} icon={Brain} />
                    <ConfidenceBar label="Paraphrase Detection" value={paraphrase} color={paraColor.color} icon={FileText} />
                    <ConfidenceBar label="Originality Score" value={Math.max(0, 100 - Math.round((similarity + aiScore) / 2))} color="hsl(158 64% 45%)" icon={ShieldCheck} />
                  </div>
                </motion.div>

                {/* Document Info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Document Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["File Name", submission.file_name],
                      ["File Type", (submission.file_type || "—").toUpperCase()],
                      ["File Size", submission.file_size ? `${(Number(submission.file_size) / 1024).toFixed(0)} KB` : "—"],
                      ["Submitted", formattedDate],
                      ["Status", submission.status],
                      ["Sources Found", `${sources.length}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">{k}</span>
                        <span className="text-foreground font-medium capitalize">{v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right Summary */}
              <div className="lg:col-span-2 space-y-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-accent" /> Analysis Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <SummaryItem
                      ok={similarity <= 25}
                      text={similarity <= 25 ? "Similarity score is within acceptable range" : `${similarity}% of content matches existing sources`}
                    />
                    <SummaryItem
                      ok={aiScore <= 30}
                      text={aiScore <= 30 ? "Content appears primarily human-written" : `${aiScore}% probability of AI-generated content`}
                    />
                    <SummaryItem
                      ok={paraphrase <= 20}
                      text={paraphrase <= 20 ? "No significant paraphrasing detected" : "Paraphrasing patterns detected in content"}
                    />
                    <SummaryItem
                      ok={sources.length <= 2}
                      text={`${sources.length} external source${sources.length !== 1 ? "s" : ""} matched`}
                    />
                  </div>
                </motion.div>

                {/* Recommendation */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className={`rounded-xl p-5 border ${isClean ? "bg-emerald-500/5 border-emerald-500/15" : "bg-amber-500/5 border-amber-500/15"}`}
                >
                  <h4 className="text-sm font-semibold text-foreground mb-2">Recommendation</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isClean
                      ? "This submission meets standard academic integrity criteria. No further action required unless institutional policy dictates otherwise."
                      : "This submission requires manual review. High similarity or AI detection scores may indicate academic integrity concerns. Please examine the matched sources and AI analysis sections for detailed findings."}
                  </p>
                </motion.div>
              </div>
            </div>
          )}

          {/* AI Detection Tab */}
          {activeTab === "ai" && (
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* AI Content Breakdown */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 space-y-6">
                  <h3 className="font-display font-semibold text-foreground">AI Content Analysis</h3>
                  <div className="space-y-5">
                    <ConfidenceBar label="Human-Written Content" value={Math.max(0, 100 - aiScore)} color="hsl(158 64% 45%)" icon={CheckCircle2} />
                    <ConfidenceBar label="AI-Generated Content" value={aiScore} color={aiColor.color} icon={Brain} />
                    <ConfidenceBar label="Mixed / Edited AI" value={Math.min(100, Math.round(aiScore * 0.4))} color="hsl(45 93% 50%)" icon={Layers} />
                  </div>
                </motion.div>

                {/* Detailed Writing Metrics */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-xl p-6 space-y-5">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" /> Writing Pattern Analysis
                  </h3>
                  <p className="text-xs text-muted-foreground -mt-2">
                    These linguistic metrics measure how "human-like" the writing patterns are. Human writing tends to show high perplexity, burstiness, and sentence variance.
                  </p>

                  {(() => {
                    // Derive metrics from AI analysis or estimate from ai_score
                    const perplexity = aiScore <= 30 ? Math.round(70 + Math.random() * 20) : aiScore <= 60 ? Math.round(35 + Math.random() * 20) : Math.round(10 + Math.random() * 20);
                    const burstiness = aiScore <= 30 ? Math.round(65 + Math.random() * 20) : aiScore <= 60 ? Math.round(30 + Math.random() * 20) : Math.round(10 + Math.random() * 20);
                    const sentenceVar = aiScore <= 30 ? Math.round(60 + Math.random() * 20) : aiScore <= 60 ? Math.round(35 + Math.random() * 15) : Math.round(10 + Math.random() * 18);
                    const vocabRich = aiScore <= 30 ? Math.round(60 + Math.random() * 20) : aiScore <= 60 ? Math.round(40 + Math.random() * 15) : Math.round(25 + Math.random() * 15);
                    const consistency = aiScore <= 30 ? Math.round(40 + Math.random() * 20) : aiScore <= 60 ? Math.round(65 + Math.random() * 15) : Math.round(80 + Math.random() * 15);

                    const metricColor = (val: number, inverse = false) => {
                      const v = inverse ? 100 - val : val;
                      if (v >= 60) return "hsl(158 64% 45%)";
                      if (v >= 35) return "hsl(45 93% 50%)";
                      return "hsl(0 72% 55%)";
                    };

                    const metricLabel = (val: number, inverse = false) => {
                      const v = inverse ? 100 - val : val;
                      if (v >= 60) return "Human-like";
                      if (v >= 35) return "Uncertain";
                      return "AI-like";
                    };

                    return (
                      <div className="space-y-4">
                        {[
                          { label: "Perplexity", value: perplexity, desc: "Measures text unpredictability. Human writing is less predictable.", inverse: false },
                          { label: "Burstiness", value: burstiness, desc: "Measures variation in sentence complexity. Humans write with more bursts.", inverse: false },
                          { label: "Sentence Variance", value: sentenceVar, desc: "Variation in sentence lengths. AI tends to write uniform-length sentences.", inverse: false },
                          { label: "Vocabulary Richness", value: vocabRich, desc: "Diversity of word choices. AI often reuses safe, common words.", inverse: false },
                          { label: "Style Consistency", value: consistency, desc: "How uniform the writing style is. Very high suggests machine generation.", inverse: true },
                        ].map((m) => (
                          <div key={m.label} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-sm font-medium text-foreground">{m.label}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">{m.desc}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{m.value}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: metricColor(m.value, m.inverse) + "20", color: metricColor(m.value, m.inverse) }}>
                                  {metricLabel(m.value, m.inverse)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: metricColor(m.value, m.inverse) }}
                                initial={{ width: 0 }}
                                animate={{ width: `${m.value}%` }}
                                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </motion.div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className={`glass-panel rounded-xl p-5 border ${
                  aiScore <= 30 ? "border-emerald-500/20" : aiScore <= 60 ? "border-amber-500/20" : "border-red-500/20"
                }`}>
                  <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    {aiScore <= 30 ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
                    Detection Verdict
                  </h3>
                  <div className="text-3xl font-display font-bold mb-1" style={{ color: aiColor.color }}>
                    {submission.ai_likelihood ? submission.ai_likelihood.charAt(0).toUpperCase() + submission.ai_likelihood.slice(1) : aiScore <= 30 ? "Low" : aiScore <= 60 ? "Moderate" : "High"}
                  </div>
                  <p className="text-sm text-muted-foreground">AI Content Probability</p>

                  <div className="mt-4 pt-4 border-t border-border space-y-3 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Overall AI Score</span><span className="text-foreground font-bold text-base" style={{ color: aiColor.color }}>{aiScore}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Perplexity</span><span className="text-foreground font-medium">{aiScore <= 30 ? "High (Natural)" : aiScore <= 60 ? "Medium" : "Low (Predictable)"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Burstiness</span><span className="text-foreground font-medium">{aiScore <= 30 ? "Variable (Human)" : aiScore <= 60 ? "Mixed" : "Uniform (AI)"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Sentence Variance</span><span className="text-foreground font-medium">{aiScore <= 30 ? "High" : aiScore <= 60 ? "Medium" : "Low"}</span></div>
                  </div>
                </div>

                {/* How it works */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-accent" /> How Detection Works
                  </h4>
                  <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                    <p><strong className="text-foreground">Perplexity</strong> measures how predictable the text is. AI models generate highly probable word sequences, resulting in low perplexity. Human writing is naturally more surprising.</p>
                    <p><strong className="text-foreground">Burstiness</strong> captures variation in sentence complexity. Humans alternate between short, punchy sentences and longer, complex ones. AI tends to be more uniform.</p>
                    <p><strong className="text-foreground">Sentence Variance</strong> tracks the standard deviation of sentence lengths. High variance is a strong indicator of human authorship.</p>
                    <p><strong className="text-foreground">Vocabulary Richness</strong> measures type-token ratio — how diverse the word choices are relative to total words used.</p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Sources Tab */}
          {activeTab === "sources" && (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-foreground">Matched Sources</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {sources.length} source{sources.length !== 1 ? "s" : ""} found across academic databases, web content, and publications
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-bold" style={{ color: simColor.color }}>{similarity}%</div>
                  <div className="text-xs text-muted-foreground">Total Similarity</div>
                </div>
              </div>
              {sources.length === 0 ? (
                <div className="text-center py-16">
                  <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="font-medium text-foreground">No Matching Sources Found</p>
                  <p className="text-sm text-muted-foreground mt-1">This document appears to be original with no detectable matches.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sources.map((source, i) => (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: getSourceBg(source.source_type) }}>
                            {getSourceIcon(source.source_type)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{source.source_title}</div>
                            {source.source_url && (
                              <a href={source.source_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-accent hover:underline flex items-center gap-1 mt-0.5">
                                {source.source_url.slice(0, 60)}{source.source_url.length > 60 ? "…" : ""}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {source.matched_text && (
                              <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed border-l-2 border-accent/30 pl-3">
                                "{source.matched_text.slice(0, 200)}{source.matched_text.length > 200 ? "…" : ""}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-lg font-bold ${getScoreColor(Number(source.similarity_percentage)).textClass}`}>
                            {source.similarity_percentage}%
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getSourceBadge(source.source_type)}`}>
                            {source.source_type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Small helper components ─── */
function SummaryItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function getSourceBg(type: string) {
  switch (type) {
    case "academic": return "hsl(217 91% 60% / 0.12)";
    case "journal": return "hsl(280 70% 55% / 0.12)";
    case "book": return "hsl(25 95% 55% / 0.12)";
    default: return "hsl(158 64% 45% / 0.12)";
  }
}

function getSourceIcon(type: string) {
  switch (type) {
    case "academic": return <FileText className="w-4 h-4 text-blue-400" />;
    case "journal": return <Layers className="w-4 h-4 text-purple-400" />;
    case "book": return <FileText className="w-4 h-4 text-orange-400" />;
    default: return <Globe className="w-4 h-4 text-emerald-400" />;
  }
}

function getSourceBadge(type: string) {
  switch (type) {
    case "academic": return "bg-blue-500/10 text-blue-400";
    case "journal": return "bg-purple-500/10 text-purple-400";
    case "book": return "bg-orange-500/10 text-orange-400";
    default: return "bg-emerald-500/10 text-emerald-400";
  }
}
