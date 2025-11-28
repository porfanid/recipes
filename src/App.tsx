import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SubmitRecipe from "./pages/SubmitRecipe";
import RecipeDetail from "./pages/RecipeDetail";
import MyRecipes from "./pages/MyRecipes";
import SavedRecipes from "./pages/SavedRecipes";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/submit" element={<SubmitRecipe />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/saved" element={<SavedRecipes />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;