import { motion } from "framer-motion";
import { Building2, Users, FileText, BarChart3, TrendingUp, Shield, Layers, Flag } from "lucide-react";

const stats = [
  { icon: Users, label: "Total Users", value: "1,247" },
  { icon: FileText, label: "Submissions", value: "8,432" },
  { icon: Flag, label: "Flagged", value: "312" },
  { icon: TrendingUp, label: "Avg Similarity", value: "14.2%" },
];

const departments = [
  { name: "Computer Science", teachers: 12, students: 340, submissions: 2100, avgSimilarity: 11 },
  { name: "English Literature", teachers: 8, students: 220, submissions: 1800, avgSimilarity: 18 },
  { name: "Business Studies", teachers: 10, students: 280, submissions: 1600, avgSimilarity: 16 },
  { name: "Engineering", teachers: 14, students: 390, submissions: 2400, avgSimilarity: 9 },
];

export default function SchoolAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Institution Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Stanford University — Overview & Management</p>
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
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-semibold text-foreground">Departments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Department</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Teachers</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Students</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Submissions</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Avg. Similarity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((d) => (
                <tr key={d.name} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-sm text-muted-foreground">{d.teachers}</td>
                  <td className="px-5 py-4 text-center text-sm text-muted-foreground">{d.students}</td>
                  <td className="px-5 py-4 text-center text-sm text-muted-foreground">{d.submissions.toLocaleString()}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-sm font-medium ${d.avgSimilarity > 15 ? "text-warning" : "text-success"}`}>{d.avgSimilarity}%</span>
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
