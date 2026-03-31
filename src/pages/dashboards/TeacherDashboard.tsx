import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Flag, Users, BarChart3, FileText, AlertTriangle, CheckCircle2, Clock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;
type EnrichedSubmission = Submission & { faculty_name?: string };

function useTeacherData(user: ReturnType<typeof useAuth>["user"]) {
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const userIds = [...new Set(data.map((s) => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setSubmissions(data.map((s) => ({ ...s, faculty_name: profileMap.get(s.user_id) || "Unknown Faculty" })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { submissions, loading };
}

function SubmissionTable({ submissions, title, emptyMessage, navigate }: {
  submissions: EnrichedSubmission[];
  title: string;
  emptyMessage: string;
  navigate: (path: string) => void;
}) {
  if (submissions.length === 0) {
    return (
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-display font-semibold text-foreground">{title}</h2></div>
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="font-display font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">{submissions.length} items</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Faculty</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Document</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Similarity</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">AI Score</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {submissions.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/report/${r.id}`)}>
                <td className="px-5 py-4 text-sm font-medium text-foreground">{r.student_name}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{r.title}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-sm font-medium ${(r.similarity_score || 0) > 25 ? "text-destructive" : (r.similarity_score || 0) > 15 ? "text-warning" : "text-success"}`}>
                    {r.similarity_score !== null ? `${r.similarity_score}%` : "—"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-sm font-medium ${(r.ai_score || 0) > 50 ? "text-destructive" : (r.ai_score || 0) > 20 ? "text-warning" : "text-success"}`}>
                    {r.ai_score !== null ? `${r.ai_score}%` : "—"}
                  </span>
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
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { submissions, loading } = useTeacherData(user);

  const path = location.pathname;

  const reviewQueue = submissions.filter((s) => ["queued", "processing", "review_pending"].includes(s.status));
  const flagged = submissions.filter((s) => s.status === "flagged");
  const uniqueStudents = new Set(submissions.map((s) => s.user_id)).size;
  const avgSimilarity = submissions.filter((s) => s.similarity_score !== null).length > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.similarity_score || 0), 0) / submissions.filter((s) => s.similarity_score !== null).length)
    : 0;

  const stats = [
    { icon: BookOpen, label: "Review Queue", value: String(reviewQueue.length) },
    { icon: Flag, label: "Flagged Submissions", value: String(flagged.length) },
    { icon: Users, label: "Active Students", value: String(uniqueStudents) },
    { icon: BarChart3, label: "Avg. Similarity", value: `${avgSimilarity}%` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Sub-page: Reviews
  if (path.endsWith("/reviews")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/teacher")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Review Queue</h1>
        </div>
        <SubmissionTable submissions={reviewQueue} title="Pending Reviews" emptyMessage="No submissions pending review" navigate={navigate} />
      </div>
    );
  }

  // Sub-page: Flagged
  if (path.endsWith("/flagged")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/teacher")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Flagged Submissions</h1>
        </div>
        <SubmissionTable submissions={flagged} title="Flagged" emptyMessage="No flagged submissions" navigate={navigate} />
      </div>
    );
  }

  // Sub-page: Analytics
  if (path.endsWith("/analytics")) {
    const completed = submissions.filter((s) => s.status === "completed").length;
    const total = submissions.length;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/teacher")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Submissions", value: total },
            { label: "Completed", value: completed },
            { label: "Completion Rate", value: total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%" },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5">
              <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <SubmissionTable submissions={submissions} title="All Submissions" emptyMessage="No submissions yet" navigate={navigate} />
      </div>
    );
  }

  // Main Dashboard
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

      <SubmissionTable submissions={submissions.slice(0, 10)} title="Recent Submissions" emptyMessage="No submissions to review yet" navigate={navigate} />
    </div>
  );
}
