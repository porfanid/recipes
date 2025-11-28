import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for auth errors in the URL hash (e.g., expired links)
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      const hashParams = new URLSearchParams(hash.substring(hash.indexOf("error=")));
      const error = hashParams.get("error");
      const errorDescription = hashParams.get("error_description");
      
      if (error) {
        const message = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "An authentication error occurred";
        
        toast({
          title: "Authentication Error",
          description: message + ". Please request a new password reset link.",
          variant: "destructive",
        });
        
        // Clean up the URL by removing error params and redirect to auth
        window.location.hash = "#/auth";
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle password recovery - redirect to profile page
        if (event === "PASSWORD_RECOVERY") {
          window.location.hash = "#/profile";
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};