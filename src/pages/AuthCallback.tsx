import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * AuthCallback handles Supabase auth redirects (password recovery, email confirmation, etc.)
 * This page processes the auth tokens/errors from the URL and redirects accordingly.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // The auth params might be in a nested hash: #/auth/callback#access_token=...
      // or in the main hash if coming from main.tsx redirect
      const fullHash = window.location.hash;
      const nestedHashIndex = fullHash.indexOf("#", 1); // Find second # if exists
      const authHash = nestedHashIndex > -1 
        ? fullHash.substring(nestedHashIndex + 1) 
        : fullHash.substring(1);
      
      const params = new URLSearchParams(authHash);
      
      // Check for errors first
      const error = params.get("error");
      const errorDescription = params.get("error_description");
      
      if (error) {
        const message = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
          : "An authentication error occurred";
        
        toast({
          title: "Authentication Error",
          description: message + ". Please request a new link.",
          variant: "destructive",
        });
        
        navigate("/auth", { replace: true });
        return;
      }

      // Check for successful auth (access_token present)
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");
      
      if (accessToken && refreshToken) {
        // Manually set the session with the tokens from the URL
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (sessionError) {
          toast({
            title: "Authentication Error",
            description: sessionError.message,
            variant: "destructive",
          });
          navigate("/auth", { replace: true });
          return;
        }

        if (data.session) {
          // Password recovery flow - redirect to profile to set new password
          if (type === "recovery") {
            toast({
              title: "Password Reset",
              description: "Please enter your new password below.",
            });
            navigate("/profile", { replace: true });
            return;
          }
          
          // Email confirmation after signup
          if (type === "signup") {
            toast({
              title: "Email confirmed!",
              description: "Your email has been confirmed. Welcome to RecipeShare!",
            });
            navigate("/", { replace: true });
            return;
          }
          
          // Other auth types - redirect to home
          toast({
            title: "Welcome!",
            description: "You've been successfully authenticated.",
          });
          navigate("/", { replace: true });
          return;
        }
      }

      // No valid auth params found, redirect to auth page
      navigate("/auth", { replace: true });
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
