import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, selectedRole);
    const routes: Record<UserRole, string> = {
      student: "/dashboard",
      teacher: "/dashboard/teacher",
      school_admin: "/dashboard/school-admin",
      super_admin: "/dashboard/super-admin",
    };
    navigate(routes[selectedRole]);
  };

  const roles: { value: UserRole; label: string; desc: string }[] = [
    { value: "student", label: "Student", desc: "Submit & track documents" },
    { value: "teacher", label: "Teacher", desc: "Review submissions" },
    { value: "school_admin", label: "School Admin", desc: "Manage institution" },
    { value: "super_admin", label: "Platform Admin", desc: "System-wide control" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full opacity-15 blur-[120px]" style={{ background: "hsl(172 66% 40%)" }} />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:text-accent transition-colors" style={{ color: "hsl(215 20% 65%)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="glass-panel rounded-2xl p-8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-sm">ON</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">OriginaSense</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">Welcome back</h1>
            <p className="text-muted-foreground text-sm mb-6">Sign in to your account to continue.</p>

            <div className="mb-6">
              <Label className="text-xs text-muted-foreground mb-2 block">Demo Role Selection</Label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-3 rounded-lg border text-left transition-all text-xs ${
                      selectedRole === role.value
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border hover:border-accent/30 text-muted-foreground"
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input id="email" type="email" placeholder="you@institution.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                <div className="relative mt-1.5">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11">
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-accent hover:underline">Sign up</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
