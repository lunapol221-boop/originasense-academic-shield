import { motion } from "framer-motion";
import { Upload, FileText, TrendingUp, AlertTriangle, Clock, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const recentSubmissions = [
  { id: "1", title: "Research Paper - Machine Learning Ethics", date: "Mar 24, 2026", similarity: 12, aiScore: 8, status: "completed" },
  { id: "2", title: "Literature Review - Quantum Computing", date: "Mar 22, 2026", similarity: 28, aiScore: 45, status: "flagged" },
  { id: "3", title: "Thesis Draft - Chapter 3", date: "Mar 20, 2026", similarity: 5, aiScore: 3, status: "completed" },
  { id: "4", title: "Lab Report - Organic Chemistry", date: "Mar 18, 2026", similarity: 15, aiScore: 12, status: "processing" },
];

function StatCard({ icon: Icon, label, value, change, accent }: { icon: React.ElementType; label: string; value: string; change?: string; accent?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`glass-panel rounded-xl p-5 ${accent ? "ring-1 ring-accent/20" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        {change && (
          <span className="text-xs font-medium text-success flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> {change}
          </span>
        )}
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

function SimilarityBadge({ value }: { value: number }) {
  const color = value > 25 ? "text-destructive" : value > 15 ? "text-warning" : "text-success";
  return <span className={`font-medium text-sm ${color}`}>{value}%</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-success/10 text-success",
    flagged: "bg-destructive/10 text-destructive",
    processing: "bg-info/10 text-info",
    pending: "bg-warning/10 text-warning",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your submission overview</p>
        </div>
        <Link to="/dashboard/submit">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" /> New Submission
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Submissions" value="24" change="+3 this week" />
        <StatCard icon={TrendingUp} label="Avg. Similarity" value="14%" />
        <StatCard icon={AlertTriangle} label="Flagged Reports" value="2" />
        <StatCard icon={Clock} label="Pending Review" value="1" accent />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">Recent Submissions</h2>
        </div>
        <div className="divide-y divide-border">
          {recentSubmissions.map((sub) => (
            <Link key={sub.id} to={`/dashboard/report/${sub.id}`} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{sub.title}</div>
                  <div className="text-xs text-muted-foreground">{sub.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-muted-foreground">Similarity</div>
                  <SimilarityBadge value={sub.similarity} />
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-xs text-muted-foreground">AI Score</div>
                  <SimilarityBadge value={sub.aiScore} />
                </div>
                <StatusBadge status={sub.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
