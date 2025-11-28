import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle Supabase auth callbacks before React renders
// Supabase redirects with hash fragments like #access_token=... or #error=...
// We need to redirect these to our /auth/callback route for proper handling
const hash = window.location.hash;
if (hash && !hash.startsWith("#/")) {
  // This is a Supabase auth callback (not a React Router hash route)
  // Redirect to /auth/callback while preserving the auth params
  const authParams = hash.substring(1); // Remove leading #
  window.location.hash = `#/auth/callback#${authParams}`;
}

createRoot(document.getElementById("root")!).render(<App />);
