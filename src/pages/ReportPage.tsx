import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Printer, FileText, Brain, Layers, Globe, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const matchedSources = [
  { source: "arxiv.org/abs/2024.12345", type: "Academic", similarity: 8, title: "Deep Learning Ethics: A Survey" },
  { source: "nature.com/articles/s41586", type: "Journal", similarity: 5, title: "AI Transparency in Research" },
  { source: "wikipedia.org/wiki/Machine_learning", type: "Web", similarity: 4, title: "Machine Learning - Wikipedia" },
  { source: "student-archive/2025-S-0342", type: "Archive", similarity: 3, title: "Previous Submission: ML Ethics Paper" },
];

const documentSections = [
  { text: "Machine learning algorithms have transformed the way we approach complex problems in virtually every domain of human activity.", highlight: null, aiSuspect: false },
  { text: "The ethical implications of deploying autonomous systems in critical decision-making processes have been extensively studied by researchers worldwide.", highlight: "high", aiSuspect: true },
  { text: "Our methodology employs a novel approach combining transformer architectures with reinforcement learning techniques to achieve state-of-the-art results.", highlight: null, aiSuspect: false },
  { text: "Recent advances in natural language processing have demonstrated remarkable capabilities in understanding and generating human-like text with unprecedented fluency and coherence.", highlight: "medium", aiSuspect: true },
  { text: "The experimental results clearly demonstrate that our proposed framework outperforms existing baseline methods across all evaluation metrics considered in this study.", highlight: "low", aiSuspect: false },
  { text: "These findings suggest that careful consideration of bias mitigation strategies is essential when implementing AI systems in educational and healthcare settings.", highlight: null, aiSuspect: true },
];

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

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<"originality" | "ai" | "paraphrase" | "sources">("originality");

  const tabs = [
    { id: "originality" as const, label: "Originality", icon: FileText },
    { id: "ai" as const, label: "AI Detection", icon: Brain },
    { id: "paraphrase" as const, label: "Paraphrase", icon: Layers },
    { id: "sources" as const, label: "Sources", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Originality Report</h1>
            <p className="text-muted-foreground text-sm">Research Paper - Machine Learning Ethics · Submitted Mar 24, 2026</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1.5" /> Export</Button>
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={12} label="Similarity Score" sublabel="Low match rate" color="hsl(158 64% 40%)" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={23} label="AI Probability" sublabel="Low AI likelihood" color="hsl(38 92% 50%)" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-xl p-6 flex justify-center">
          <CircularProgress value={8} label="Paraphrase Score" sublabel="Minimal suspicion" color="hsl(217 91% 60%)" />
        </motion.div>
      </div>

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
            <h3 className="font-display font-semibold text-foreground mb-4">Document Content</h3>
            <div className="space-y-3 text-sm leading-relaxed">
              {documentSections.map((section, i) => (
                <p
                  key={i}
                  className={`p-2 rounded-md transition-colors ${
                    section.highlight === "high" ? "bg-destructive/10 border-l-2 border-destructive" :
                    section.highlight === "medium" ? "bg-warning/10 border-l-2 border-warning" :
                    section.highlight === "low" ? "bg-info/10 border-l-2 border-info" :
                    "text-foreground"
                  }`}
                >
                  {section.text}
                </p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Match Breakdown</h3>
              <div className="space-y-4">
                <ConfidenceBar label="Web Sources" value={4} color="hsl(217 91% 60%)" />
                <ConfidenceBar label="Academic Papers" value={5} color="hsl(172 66% 40%)" />
                <ConfidenceBar label="Student Archives" value={3} color="hsl(38 92% 50%)" />
                <ConfidenceBar label="Journal Articles" value={0} color="hsl(280 67% 60%)" />
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" /> Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Overall similarity is within acceptable range</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">2 sections flagged for potential paraphrasing</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">AI detection shows low probability of generated content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-panel rounded-xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">AI Detection Heatmap</h3>
            <div className="space-y-3 text-sm leading-relaxed">
              {documentSections.map((section, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-1 rounded-full shrink-0 ${
                    section.aiSuspect ? "bg-warning" : "bg-success"
                  }`} />
                  <p className="text-foreground">{section.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">AI Analysis</h3>
              <div className="space-y-4">
                <ConfidenceBar label="Human-written likelihood" value={77} color="hsl(158 64% 40%)" />
                <ConfidenceBar label="AI-generated probability" value={23} color="hsl(38 92% 50%)" />
                <ConfidenceBar label="Mixed content probability" value={15} color="hsl(217 91% 60%)" />
              </div>
            </div>
            <div className="glass-panel rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-3">Detection Verdict</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <div className="text-sm font-medium text-foreground">Low AI Likelihood</div>
                  <div className="text-xs text-muted-foreground">Content appears primarily human-written</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "paraphrase" && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Paraphrase Analysis</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Semantic analysis of text patterns that may indicate paraphrased content from known sources.
          </p>
          <div className="space-y-4">
            {documentSections.filter((s) => s.highlight).map((section, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start gap-3">
                  <div className={`px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${
                    section.highlight === "high" ? "bg-destructive/10 text-destructive" :
                    section.highlight === "medium" ? "bg-warning/10 text-warning" : "bg-info/10 text-info"
                  }`}>
                    {section.highlight} match
                  </div>
                  <div>
                    <p className="text-sm text-foreground mb-2">{section.text}</p>
                    <p className="text-xs text-muted-foreground">Similar patterns found in academic databases — semantic similarity detected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "sources" && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Matched Sources</h3>
            <p className="text-sm text-muted-foreground mt-1">{matchedSources.length} sources identified</p>
          </div>
          <div className="divide-y divide-border">
            {matchedSources.map((source, i) => (
              <div key={i} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{source.title}</div>
                    <div className="text-xs text-muted-foreground">{source.source}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    source.type === "Academic" ? "bg-accent/10 text-accent" :
                    source.type === "Journal" ? "bg-info/10 text-info" :
                    source.type === "Web" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                  }`}>
                    {source.type}
                  </span>
                  <span className="text-sm font-medium text-foreground">{source.similarity}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
