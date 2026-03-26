import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [institutionCount, setInstitutionCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [institutions, setInstitutions] = useState<{ id: string; name: string; plan: string; is_active: boolean; slug: string }[]>([]);
  const [auditLogs, setAuditLogs] = useState<{ action: string; target: string | null; created_at: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [instRes, profileRes, subRes, auditRes] = await Promise.all([
        supabase.from("institutions").select("id, name, plan, is_active, slug").order("name"),
        supabase.from("profiles").select("id"),
        supabase.from("submissions").select("id, status"),
        supabase.from("audit_logs").select("action, target, created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      if (instRes.data) {
        setInstitutions(instRes.data);
        setInstitutionCount(instRes.data.length);
      }
      if (profileRes.data) setUserCount(profileRes.data.length);
      if (subRes.data) {
        setSubmissionCount(subRes.data.length);
        setFlaggedCount(subRes.data.filter((s) => s.status === "flagged").length);
      }
      if (auditRes.data) setAuditLogs(auditRes.data);

      setLoading(false);
    };

    fetchData();
  }, []);

  const stats = [
    { icon: Building2, label: "Institutions", value: String(institutionCount) },
    { icon: Users, label: "Total Users", value: String(userCount) },
    { icon: FileText, label: "Total Submissions", value: String(submissionCount) },
    { icon: AlertTriangle, label: "Global Flags", value: String(flaggedCount) },
  ];

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

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
            <h2 className="font-display font-semibold text-foreground">Institutions</h2>
          </div>
          {institutions.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No institutions registered yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {institutions.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{inst.name}</div>
                      <div className="text-xs text-muted-foreground">{inst.slug}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize">{inst.plan}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.is_active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {inst.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Recent Activity</h2>
          </div>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((log, i) => (
                <div key={i} className="p-4">
                  <div className="text-sm font-medium text-foreground">{log.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">{log.target || "—"} · {timeAgo(log.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
