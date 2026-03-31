import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Users, FileText, AlertTriangle, Loader2, ArrowLeft, History, Shield, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;

export default function SuperAdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<{ id: string; name: string; plan: string; is_active: boolean; slug: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; user_id: string; full_name: string | null; institution_id: string | null; department: string | null }[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [submissions, setSubmissions] = useState<(Submission & { faculty_name?: string })[]>([]);
  const [auditLogs, setAuditLogs] = useState<{ action: string; target: string | null; created_at: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [instRes, profileRes, subRes, auditRes] = await Promise.all([
        supabase.from("institutions").select("id, name, plan, is_active, slug").order("name"),
        supabase.from("profiles").select("id, user_id, full_name, institution_id, department"),
        supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("audit_logs").select("action, target, created_at").order("created_at", { ascending: false }).limit(50),
      ]);

      if (instRes.data) setInstitutions(instRes.data);
      if (profileRes.data) {
        setAllUsers(profileRes.data);
        const uids = profileRes.data.map((p) => p.user_id);
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", uids);
        if (roles) setUserRoles(new Map(roles.map((r) => [r.user_id, r.role])));
      }
      if (subRes.data) {
        const userIds = [...new Set(subRes.data.map((s) => s.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setSubmissions(subRes.data.map((s) => ({ ...s, faculty_name: profileMap.get(s.user_id) || "Unknown" })));
      }
      if (auditRes.data) setAuditLogs(auditRes.data);

      setLoading(false);
    };
    fetchData();
  }, []);

  const path = location.pathname;
  const institutionCount = institutions.length;
  const userCount = allUsers.length;
  const submissionCount = submissions.length;
  const flaggedCount = submissions.filter((s) => s.status === "flagged").length;

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

  // Sub-page: Institutions
  if (path.endsWith("/institutions")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/super-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">All Institutions</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          {institutions.length === 0 ? (
            <div className="text-center py-12"><Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No institutions registered</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Slug</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Plan</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{inst.name}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground font-mono">{inst.slug}</td>
                      <td className="px-5 py-4 text-center"><span className="text-xs text-muted-foreground capitalize">{inst.plan}</span></td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inst.is_active ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {inst.is_active ? "active" : "inactive"}
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

  // Sub-page: All Users
  if (path.endsWith("/users")) {
    const instMap = new Map(institutions.map((i) => [i.id, i.name]));
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/super-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">All Users ({allUsers.length})</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Institution</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Department</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Role</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{u.full_name || "Unnamed"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{u.institution_id ? instMap.get(u.institution_id) || "—" : "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{u.department || "—"}</td>
                    <td className="px-5 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-accent/10 text-accent">{getRoleLabel(userRoles.get(u.user_id) || "student")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Sub-page: Analytics
  if (path.endsWith("/analytics")) {
    const completed = submissions.filter((s) => s.status === "completed").length;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/super-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Platform Analytics</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3"><s.icon className="w-5 h-5 text-accent" /></div>
              <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-3">Submission Status Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Completed", count: completed, color: "text-success" },
              { label: "Flagged", count: flaggedCount, color: "text-destructive" },
              { label: "Processing", count: submissions.filter((s) => s.status === "processing").length, color: "text-warning" },
              { label: "Queued", count: submissions.filter((s) => s.status === "queued").length, color: "text-muted-foreground" },
            ].map((item) => (
              <div key={item.label}>
                <div className={`font-display text-xl font-bold ${item.color}`}>{item.count}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Sub-page: Audit Logs
  if (path.endsWith("/audit")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/super-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12"><History className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No audit logs yet</p></div>
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((log, i) => (
                <div key={i} className="p-5 hover:bg-muted/30 transition-colors">
                  <div className="text-sm font-medium text-foreground">{log.action}</div>
                  <div className="text-xs text-muted-foreground mt-1">{log.target || "—"} · {timeAgo(log.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sub-page: System
  if (path.endsWith("/system")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/super-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">System Settings</h1>
        </div>
        <div className="glass-panel rounded-xl p-6 space-y-4">
          <h2 className="font-display font-semibold text-foreground">Platform Status</h2>
          <div className="space-y-3">
            {[
              { label: "Database", status: "Operational" },
              { label: "File Storage", status: "Operational" },
              { label: "Authentication", status: "Operational" },
              { label: "AI Detection Engine", status: "Operational" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-2">Quick Stats</h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Institutions</span><span className="font-medium text-foreground">{institutionCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Users</span><span className="font-medium text-foreground">{userCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Submissions</span><span className="font-medium text-foreground">{submissionCount}</span></div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">OriginaSense Nexus — System Administration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel rounded-xl p-5">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3"><s.icon className="w-5 h-5 text-accent" /></div>
            <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border"><h2 className="font-display font-semibold text-foreground">Institutions</h2></div>
          {institutions.length === 0 ? (
            <div className="text-center py-12"><Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No institutions registered yet</p></div>
          ) : (
            <div className="divide-y divide-border">
              {institutions.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between p-5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center"><Building2 className="w-4 h-4 text-accent" /></div>
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
          <div className="p-5 border-b border-border"><h2 className="font-display font-semibold text-foreground">Recent Activity</h2></div>
          {auditLogs.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground text-sm">No recent activity</p></div>
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.slice(0, 10).map((log, i) => (
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
