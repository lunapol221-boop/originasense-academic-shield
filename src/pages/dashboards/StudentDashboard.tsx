import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, TrendingUp, AlertTriangle, Clock, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;

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

function SimilarityBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-sm text-muted-foreground">—</span>;
  const color = value > 25 ? "text-destructive" : value > 15 ? "text-warning" : "text-success";
  return <span className={`font-medium text-sm ${color}`}>{value}%</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-success/10 text-success",
    flagged: "bg-destructive/10 text-destructive",
    processing: "bg-info/10 text-info",
    queued: "bg-warning/10 text-warning",
    review_pending: "bg-accent/10 text-accent",
    failed: "bg-destructive/10 text-destructive",
  };
  const labels: Record<string, string> = {
    review_pending: "Review Pending",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || "bg-muted text-muted-foreground"}`}>
      {labels[status] || status}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) setSubmissions(data);
      setLoading(false);
    };

    fetchSubmissions();

    // Realtime subscription for updates
    const channel = supabase
      .channel("my-submissions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions", filter: `user_id=eq.${user.id}` },
        () => fetchSubmissions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const totalSubmissions = submissions.length;
  const avgSimilarity = submissions.filter((s) => s.similarity_score !== null).length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.similarity_score || 0), 0) / submissions.filter((s) => s.similarity_score !== null).length)
    : 0;
  const flaggedCount = submissions.filter((s) => s.status === "flagged").length;
  const pendingCount = submissions.filter((s) => ["queued", "processing", "review_pending"].includes(s.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back, {user?.profile?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here's your submission overview</p>
        </div>
        <Link to="/dashboard/submit">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" /> New Submission
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Submissions" value={String(totalSubmissions)} />
        <StatCard icon={TrendingUp} label="Avg. Similarity" value={`${avgSimilarity}%`} />
        <StatCard icon={AlertTriangle} label="Flagged Reports" value={String(flaggedCount)} />
        <StatCard icon={Clock} label="Pending" value={String(pendingCount)} accent />
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">Recent Submissions</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No submissions yet</p>
            <Link to="/dashboard/submit">
              <Button variant="outline" className="mt-4" size="sm">
                <Upload className="w-4 h-4 mr-2" /> Submit your first document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                to={`/dashboard/report/${sub.id}`}
                className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{sub.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(sub.created_at)}
                      {sub.file_size ? ` · ${formatSize(sub.file_size)}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-muted-foreground">Similarity</div>
                    <SimilarityBadge value={sub.similarity_score} />
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs text-muted-foreground">AI Score</div>
                    <SimilarityBadge value={sub.ai_score} />
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
