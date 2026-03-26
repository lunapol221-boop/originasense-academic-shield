import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, Upload, FileText, BarChart3, Users, Settings,
  Moon, Sun, LogOut, Bell, Search, ChevronLeft, Building2, Shield,
  BookOpen, Flag, History, Layers
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const roleNavItems: Record<string, NavItem[]> = {
  student: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Submit Document", icon: Upload, href: "/dashboard/submit" },
    { label: "My Submissions", icon: FileText, href: "/dashboard/submissions" },
    { label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  teacher: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/teacher" },
    { label: "Review Queue", icon: BookOpen, href: "/dashboard/teacher/reviews" },
    { label: "Flagged", icon: Flag, href: "/dashboard/teacher/flagged" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/teacher/analytics" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  school_admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/school-admin" },
    { label: "Users", icon: Users, href: "/dashboard/school-admin/users" },
    { label: "Submissions", icon: FileText, href: "/dashboard/school-admin/submissions" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/school-admin/analytics" },
    { label: "Departments", icon: Layers, href: "/dashboard/school-admin/departments" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard/super-admin" },
    { label: "Institutions", icon: Building2, href: "/dashboard/super-admin/institutions" },
    { label: "All Users", icon: Users, href: "/dashboard/super-admin/users" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/super-admin/analytics" },
    { label: "Audit Logs", icon: History, href: "/dashboard/super-admin/audit" },
    { label: "System", icon: Shield, href: "/dashboard/super-admin/system" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = roleNavItems[user?.role || "student"] || [];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = user?.profile?.full_name || user?.email || "User";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}>
        <div className={`h-16 flex items-center border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "px-5"}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-display font-bold text-xs">ON</span>
              </div>
              <span className="font-display font-semibold text-sm text-sidebar-foreground">OriginaSense</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 ${collapsed ? "" : "ml-auto"}`}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button onClick={toggleTheme} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full transition-colors ${collapsed ? "justify-center" : ""}`}>
            {theme === "dark" ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button onClick={handleLogout} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full transition-colors ${collapsed ? "justify-center" : ""}`}>
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input placeholder="Search submissions, reports..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1" />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                {displayName.charAt(0)}
              </div>
              {user && (
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-foreground">{displayName}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user.role.replace("_", " ")}</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
