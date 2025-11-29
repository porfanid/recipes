import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import About from "./pages/About";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import SubmitRecipe from "./pages/SubmitRecipe";
import EditRecipe from "./pages/EditRecipe";
import RecipeDetail from "./pages/RecipeDetail";
import MyRecipes from "./pages/MyRecipes";
import SavedRecipes from "./pages/SavedRecipes";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PackagingIdeasIndex from "./pages/PackagingIdeasIndex";
import SubmitPackagingIdea from "./pages/SubmitPackagingIdea";
import EditPackagingIdea from "./pages/EditPackagingIdea";
import PackagingIdeaDetail from "./pages/PackagingIdeaDetail";
import MyPackagingIdeas from "./pages/MyPackagingIdeas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<About />} />
            <Route path="/recipes" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/submit" element={<SubmitRecipe />} />
            <Route path="/recipe/:id/edit" element={<EditRecipe />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/my-recipes" element={<MyRecipes />} />
            <Route path="/saved" element={<SavedRecipes />} />
            <Route path="/packaging-repurposing" element={<PackagingIdeasIndex />} />
            <Route path="/submit-packaging-idea" element={<SubmitPackagingIdea />} />
            <Route path="/packaging-idea/:id/edit" element={<EditPackagingIdea />} />
            <Route path="/packaging-idea/:id" element={<PackagingIdeaDetail />} />
            <Route path="/my-packaging-ideas" element={<MyPackagingIdeas />} />
            <Route path="/profile" element={<Profile />} />
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
