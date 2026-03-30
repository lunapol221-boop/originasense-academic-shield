import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "student" | "teacher" | "school_admin" | "super_admin";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  institution_id: string | null;
  department: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: Profile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function fetchUserData(supabaseUser: User): Promise<AuthUser> {
  // Fetch role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", supabaseUser.id)
    .limit(1)
    .single();

  // Fetch profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, institution_id, department")
    .eq("user_id", supabaseUser.id)
    .limit(1)
    .single();

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    role: (roleData?.role as UserRole) || "student",
    profile: profileData || null,
  };
}

async function fetchUserDataWithRetry(supabaseUser: User, attempts = 3): Promise<AuthUser> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchUserData(supabaseUser);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to load user data");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const loadUser = useCallback(async (supabaseUser: User | null) => {
    if (!isAuthReady) return;

    if (!supabaseUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const userData = await fetchUserDataWithRetry(supabaseUser);
      setUser(userData);
    } catch {
      setUser(null);
      await supabase.auth.signOut();
      setSession(null);
    }

    setIsLoading(false);
  }, [isAuthReady]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    void loadUser(session?.user ?? null);
  }, [isAuthReady, loadUser, session]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        return { error: result.error instanceof Error ? result.error : new Error(String(result.error)) };
      }
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session && !!user,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
