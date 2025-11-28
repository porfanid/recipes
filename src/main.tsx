import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle Supabase auth errors/callbacks before React renders
// This fixes issues with HashRouter when Supabase redirects with error params like #error=...
const hash = window.location.hash;
if (hash && !hash.startsWith("#/")) {
  // Check if this is an auth error (e.g., #error=access_denied&error_code=otp_expired)
  if (hash.includes("error=")) {
    // Preserve error params but redirect to a valid route
    const errorParams = hash.substring(1); // Remove the leading #
    window.location.hash = `#/auth?${errorParams}`;
  } 
  // Check if this is a successful auth callback (e.g., #access_token=...)
  else if (hash.includes("access_token=") || hash.includes("type=recovery")) {
    // Let Supabase handle the tokens, then redirect to home
    // The AuthProvider will detect PASSWORD_RECOVERY and redirect to profile
    window.location.hash = "#/";
  }
}

createRoot(document.getElementById("root")!).render(<App />);
