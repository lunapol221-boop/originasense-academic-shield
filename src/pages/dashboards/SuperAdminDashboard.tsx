import { motion } from "framer-motion";
import { Building2, Users, FileText, Globe, TrendingUp, Shield, Activity, AlertTriangle } from "lucide-react";

const stats = [
  { icon: Building2, label: "Institutions", value: "127" },
  { icon: Users, label: "Total Users", value: "45,230" },
  { icon: FileText, label: "Total Submissions", value: "312K" },
  { icon: AlertTriangle, label: "Global Flags", value: "2,841" },
];

const institutions = [
  { name: "Stanford University", users: 4200, submissions: 28400, status: "active", plan: "Enterprise" },
  { name: "MIT", users: 3800, submissions: 25100, status: "active", plan: "Enterprise" },
  { name: "Oxford University", users: 5100, submissions: 32000, status: "active", plan: "Professional" },
  { name: "Harvard University", users: 4500, submissions: 30200, status: "active", plan: "Enterprise" },
  { name: "UC Berkeley", users: 3200, submissions: 21800, status: "trial", plan: "Starter" },
];

const auditLogs = [
  { action: "Institution activated", user: "System Admin", target: "UC Berkeley", time: "2 hours ago" },
  { action: "Threshold updated", user: "System Admin", target: "Global Settings", time: "5 hours ago" },
  { action: "User role changed", user: "System Admin", target: "Dr. Sarah M.", time: "1 day ago" },
];

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">OriginaSense Nexus — System Administration</p>
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

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Top Institutions</h2>
          </div>
          <div className="divide-y divide-border">
            {institutions.map((inst) => (
              <div key={inst.name} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{inst.name}</div>
                    <div className="text-xs text-muted-foreground">{inst.users.toLocaleString()} users · {inst.submissions.toLocaleString()} submissions</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{inst.plan}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                    {inst.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {auditLogs.map((log, i) => (
              <div key={i} className="p-4">
                <div className="text-sm font-medium text-foreground">{log.action}</div>
                <div className="text-xs text-muted-foreground mt-1">{log.target} · {log.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
