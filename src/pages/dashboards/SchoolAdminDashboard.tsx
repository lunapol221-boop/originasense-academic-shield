import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Users, FileText, Layers, TrendingUp, Flag, Loader2, ArrowLeft, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"submissions">;

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [submissions, setSubmissions] = useState<(Submission & { faculty_name?: string })[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [avgSimilarity, setAvgSimilarity] = useState(0);
  const [departments, setDepartments] = useState<{ name: string; id: string }[]>([]);
  const [institutionName, setInstitutionName] = useState("Your Institution");
  const [users, setUsers] = useState<{ id: string; full_name: string | null; department: string | null; user_id: string }[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const instId = user.profile?.institution_id;

      if (instId) {
        const { data: inst } = await supabase.from("institutions").select("name").eq("id", instId).single();
        if (inst) setInstitutionName(inst.name);
      }

      if (instId) {
        const { data: depts } = await supabase.from("departments").select("id, name").eq("institution_id", instId);
        if (depts) setDepartments(depts);
      }

      // Fetch submissions
      const submissionsQuery = instId
        ? supabase.from("submissions").select("*").eq("institution_id", instId).order("created_at", { ascending: false }).limit(100)
        : supabase.from("submissions").select("*").order("created_at", { ascending: false }).limit(100);
      
      const { data: subs } = await submissionsQuery;
      if (subs) {
        setFlaggedCount(subs.filter((s) => s.status === "flagged").length);
        const withScores = subs.filter((s) => s.similarity_score !== null);
        if (withScores.length > 0) {
          setAvgSimilarity(Math.round(withScores.reduce((a, s) => a + (s.similarity_score || 0), 0) / withScores.length));
        }
        // Enrich with faculty names
        const userIds = [...new Set(subs.map((s) => s.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
        setSubmissions(subs.map((s) => ({ ...s, faculty_name: profileMap.get(s.user_id) || "Unknown" })));
      }

      // Fetch users at institution
      if (instId) {
        const { data: profiles } = await supabase.from("profiles").select("id, user_id, full_name, department").eq("institution_id", instId);
        if (profiles) {
          setTotalUsers(profiles.length);
          setUsers(profiles);
          // Fetch roles for these users
          const uids = profiles.map((p) => p.user_id);
          const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", uids);
          if (roles) setUserRoles(new Map(roles.map((r) => [r.user_id, r.role])));
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const path = location.pathname;

  const stats = [
    { icon: Users, label: "Total Users", value: String(totalUsers) },
    { icon: FileText, label: "Submissions", value: String(submissions.length) },
    { icon: Flag, label: "Flagged", value: String(flaggedCount) },
    { icon: TrendingUp, label: "Avg Similarity", value: `${avgSimilarity}%` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Sub-page: Users
  if (path.endsWith("/users")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/school-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Users — {institutionName}</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Department</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Role</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{u.full_name || "Unnamed"}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{u.department || "—"}</td>
                      <td className="px-5 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-accent/10 text-accent">{getRoleLabel(userRoles.get(u.user_id) || "student")}</span></td>
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

  // Sub-page: Submissions
  if (path.endsWith("/submissions")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/school-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Submissions — {institutionName}</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No submissions yet</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Faculty</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Document</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Similarity</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/report/${s.id}`)}>
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{s.student_name}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{s.title}</td>
                      <td className="px-5 py-4 text-center"><span className={`text-sm font-medium ${(s.similarity_score || 0) > 25 ? "text-destructive" : "text-success"}`}>{s.similarity_score !== null ? `${s.similarity_score}%` : "—"}</span></td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          s.status === "flagged" ? "bg-destructive/10 text-destructive" :
                          s.status === "completed" ? "bg-success/10 text-success" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {s.status === "flagged" ? <AlertTriangle className="w-3 h-3" /> : s.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {s.status.replace("_", " ")}
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

  // Sub-page: Analytics
  if (path.endsWith("/analytics")) {
    const completed = submissions.filter((s) => s.status === "completed").length;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/school-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics — {institutionName}</h1>
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
          <h2 className="font-display font-semibold text-foreground mb-3">Submission Breakdown</h2>
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

  // Sub-page: Departments
  if (path.endsWith("/departments")) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/school-admin")}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Departments — {institutionName}</h1>
        </div>
        <div className="glass-panel rounded-xl overflow-hidden">
          {departments.length === 0 ? (
            <div className="text-center py-12"><Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No departments configured yet</p></div>
          ) : (
            <div className="divide-y divide-border">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><Layers className="w-4 h-4 text-accent" /></div>
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Institution Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{institutionName} — Overview & Management</p>
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

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border"><h2 className="font-display font-semibold text-foreground">Departments</h2></div>
        {departments.length === 0 ? (
          <div className="text-center py-12"><Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground text-sm">No departments configured yet</p></div>
        ) : (
          <div className="divide-y divide-border">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><Layers className="w-4 h-4 text-accent" /></div>
                <span className="text-sm font-medium text-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
