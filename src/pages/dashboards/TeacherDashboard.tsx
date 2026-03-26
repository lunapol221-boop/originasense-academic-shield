import { motion } from "framer-motion";
import { BookOpen, Flag, Users, BarChart3, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const stats = [
  { icon: BookOpen, label: "Review Queue", value: "18", change: "+5 today" },
  { icon: Flag, label: "Flagged Submissions", value: "7" },
  { icon: Users, label: "Active Students", value: "142" },
  { icon: BarChart3, label: "Avg. Class Similarity", value: "16%" },
];

const reviews = [
  { student: "Emma Wilson", doc: "AI Ethics Final Paper", similarity: 32, aiScore: 67, status: "flagged" },
  { student: "James Lee", doc: "Data Science Report", similarity: 8, aiScore: 5, status: "pending" },
  { student: "Maria Garcia", doc: "Research Methodology Essay", similarity: 22, aiScore: 14, status: "pending" },
  { student: "Tom Brown", doc: "Statistical Analysis Review", similarity: 4, aiScore: 2, status: "approved" },
  { student: "Lisa Chen", doc: "Machine Learning Overview", similarity: 45, aiScore: 78, status: "flagged" },
];

export default function TeacherDashboard() {
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
          <span className="text-xs text-muted-foreground">Showing 5 of 18</span>
        </div>
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
              {reviews.map((r) => (
                <tr key={r.student} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{r.student}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{r.doc}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-sm font-medium ${r.similarity > 25 ? "text-destructive" : r.similarity > 15 ? "text-warning" : "text-success"}`}>{r.similarity}%</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-sm font-medium ${r.aiScore > 50 ? "text-destructive" : r.aiScore > 20 ? "text-warning" : "text-success"}`}>{r.aiScore}%</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      r.status === "flagged" ? "bg-destructive/10 text-destructive" :
                      r.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
                      {r.status === "flagged" ? <AlertTriangle className="w-3 h-3" /> :
                       r.status === "approved" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
