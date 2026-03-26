import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Flag, Users, BarChart3, FileText, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<(Submission & { student_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReviewQueue = async () => {
      // Get submissions for the teacher's institution
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        // Fetch student names for the submissions
        const userIds = [...new Set(data.map((s) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setSubmissions(data.map((s) => ({ ...s, student_name: profileMap.get(s.user_id) || "Unknown Student" })));
      }
      setLoading(false);
    };

    fetchReviewQueue();
  }, [user]);

  const reviewCount = submissions.filter((s) => ["queued", "processing", "review_pending"].includes(s.status)).length;
  const flaggedCount = submissions.filter((s) => s.status === "flagged").length;
  const uniqueStudents = new Set(submissions.map((s) => s.user_id)).size;
  const avgSimilarity = submissions.filter((s) => s.similarity_score !== null).length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.similarity_score || 0), 0) / submissions.filter((s) => s.similarity_score !== null).length)
    : 0;

  const stats = [
    { icon: BookOpen, label: "Review Queue", value: String(reviewCount) },
    { icon: Flag, label: "Flagged Submissions", value: String(flaggedCount) },
    { icon: Users, label: "Active Students", value: String(uniqueStudents) },
    { icon: BarChart3, label: "Avg. Similarity", value: `${avgSimilarity}%` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage student submissions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5 text-accent" />
            </div>
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">Review Queue</h2>
          <span className="text-xs text-muted-foreground">{submissions.length} submissions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No submissions to review yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Student</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Document</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Similarity</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">AI Score</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/dashboard/report/${r.id}`}>
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{r.student_name}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{r.title}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        (r.similarity_score || 0) > 25 ? "text-destructive" : (r.similarity_score || 0) > 15 ? "text-warning" : "text-success"
                      }`}>{r.similarity_score !== null ? `${r.similarity_score}%` : "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        (r.ai_score || 0) > 50 ? "text-destructive" : (r.ai_score || 0) > 20 ? "text-warning" : "text-success"
                      }`}>{r.ai_score !== null ? `${r.ai_score}%` : "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        r.status === "flagged" ? "bg-destructive/10 text-destructive" :
                        r.status === "completed" ? "bg-success/10 text-success" :
                        ["queued", "processing", "review_pending"].includes(r.status) ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {r.status === "flagged" ? <AlertTriangle className="w-3 h-3" /> :
                         r.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {r.status === "review_pending" ? "Review Pending" : r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
