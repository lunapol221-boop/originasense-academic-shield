import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, FileText, Layers, TrendingUp, Flag, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [avgSimilarity, setAvgSimilarity] = useState(0);
  const [departments, setDepartments] = useState<{ name: string; id: string }[]>([]);
  const [institutionName, setInstitutionName] = useState("Your Institution");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const instId = user.profile?.institution_id;

      // Fetch institution name
      if (instId) {
        const { data: inst } = await supabase.from("institutions").select("name").eq("id", instId).single();
        if (inst) setInstitutionName(inst.name);
      }

      // Fetch departments
      if (instId) {
        const { data: depts } = await supabase.from("departments").select("id, name").eq("institution_id", instId);
        if (depts) setDepartments(depts);
      }

      // Fetch submissions for this institution
      const submissionsQuery = instId
        ? supabase.from("submissions").select("id, similarity_score, status").eq("institution_id", instId)
        : supabase.from("submissions").select("id, similarity_score, status");
      
      const { data: subs } = await submissionsQuery;
      if (subs) {
        setTotalSubmissions(subs.length);
        setFlaggedCount(subs.filter((s) => s.status === "flagged").length);
        const withScores = subs.filter((s) => s.similarity_score !== null);
        if (withScores.length > 0) {
          setAvgSimilarity(Math.round(withScores.reduce((a, s) => a + (s.similarity_score || 0), 0) / withScores.length));
        }
      }

      // Count users at this institution
      if (instId) {
        const { data: profiles } = await supabase.from("profiles").select("id").eq("institution_id", instId);
        if (profiles) setTotalUsers(profiles.length);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const stats = [
    { icon: Users, label: "Total Users", value: String(totalUsers) },
    { icon: FileText, label: "Submissions", value: String(totalSubmissions) },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Institution Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">{institutionName} — Overview & Management</p>
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
        {departments.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No departments configured yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-5 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
