import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { RecipeCard } from "@/components/RecipeCard";
import { Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SavedRecipes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const { data: savedRecipes, isLoading } = useQuery({
    queryKey: ["saved-recipes", user.id],
    queryFn: async () => {
      const { data: savedData, error: savedError } = await supabase
        .from("saved_recipes")
        .select("recipe_id")
        .eq("user_id", user.id);

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) return [];

      const recipeIds = savedData.map((s) => s.recipe_id);
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds)
        .eq("status", "approved");

      if (recipesError) throw recipesError;

      const authorIds = [...new Set(recipesData?.map(r => r.author_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return recipesData?.map(recipe => ({
        ...recipe,
        profiles: profilesMap.get(recipe.author_id),
      })) || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-8 w-8 text-primary fill-current" />
          <h1 className="font-serif text-4xl font-bold">Saved Recipes</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : savedRecipes && savedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map((recipe) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-serif text-2xl font-semibold mb-2">No saved recipes yet</h3>
            <p className="text-muted-foreground">Start bookmarking recipes you love!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRecipes;