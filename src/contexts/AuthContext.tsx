import { useState, createContext, useContext } from "react";

export type UserRole = "student" | "teacher" | "school_admin" | "super_admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

const DEMO_USERS: Record<UserRole, User> = {
  student: { id: "1", name: "Alex Chen", email: "alex@university.edu", role: "student", institution: "Stanford University" },
  teacher: { id: "2", name: "Dr. Sarah Mitchell", email: "s.mitchell@university.edu", role: "teacher", institution: "Stanford University" },
  school_admin: { id: "3", name: "Prof. James Wright", email: "j.wright@university.edu", role: "school_admin", institution: "Stanford University" },
  super_admin: { id: "4", name: "System Admin", email: "admin@originasense.com", role: "super_admin" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("originasense-user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (_email: string, _password: string, role: UserRole) => {
    const u = DEMO_USERS[role];
    setUser(u);
    localStorage.setItem("originasense-user", JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("originasense-user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
