import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RecipeCard } from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, UtensilsCrossed, ChefHat, Plus, LogOut, Shield, Settings, Info, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", "approved"],
    queryFn: async () => {
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      // Fetch profiles for all authors
      const authorIds = [...new Set(recipesData?.map(r => r.author_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // Map profiles to recipes
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return recipesData?.map(recipe => ({
        ...recipe,
        profiles: profilesMap.get(recipe.author_id),
      })) || [];
    },
  });

  const filteredRecipes = recipes?.filter((recipe) => {
    const query = searchQuery.toLowerCase();
    return (
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-warmth text-white py-20">
        <div className="container mx-auto px-4 text-center">
        
        <div className="flex justify-end mb-6 w-100">
        <Button asChild variant="default" size="sm">
                <Link to="/submit" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Recipe
                </Link>
              </Button>
              </div>
          <div className="flex justify-center mb-6">
            <UtensilsCrossed className="h-16 w-16 animate-fade-in" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4 animate-fade-in text-balance">
            Discover & Share Amazing Recipes
          </h1>
          
              
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto animate-fade-in">
            A community-driven platform where home cooks share their favorite recipes
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative animate-fade-in">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg bg-white/95 backdrop-blur-sm text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Recipes Grid */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredRecipes && filteredRecipes.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold">
                {searchQuery ? "Search Results" : "Latest Recipes"}
              </h2>
              <p className="text-muted-foreground">
                {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  description={recipe.description}
                  imageUrl={recipe.image_url}
                  prepTime={recipe.prep_time}
                  cookTime={recipe.cook_time}
                  servings={recipe.servings}
                  tags={recipe.tags}
                  authorUsername={recipe.profiles?.username || "Unknown"}
                  authorAvatarUrl={recipe.profiles?.avatar_url}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-serif text-2xl font-semibold mb-2">
              {searchQuery ? "No recipes found" : "No recipes yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Be the first to share a recipe!"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card ${className}`}>{children}</div>;
}

export default Index;
