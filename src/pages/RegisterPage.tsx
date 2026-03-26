import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password, "student");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-15 blur-[120px]" style={{ background: "hsl(172 66% 40%)" }} />

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
            <h1 className="font-display text-2xl font-bold text-foreground mt-4 mb-1">Create your account</h1>
            <p className="text-muted-foreground text-sm mb-6">Start protecting academic integrity today.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-foreground">Full Name</Label>
                <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="reg-email" className="text-sm text-foreground">Email</Label>
                <Input id="reg-email" type="email" placeholder="you@institution.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="institution" className="text-sm text-foreground">Institution</Label>
                <Input id="institution" placeholder="University or school name" value={institution} onChange={(e) => setInstitution(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="reg-password" className="text-sm text-foreground">Password</Label>
                <Input id="reg-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-accent hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
