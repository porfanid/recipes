import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UtensilsCrossed } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MyRecipes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["my-recipes", user.id],
    queryFn: async () => {
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      return recipesData.map(recipe => ({
        ...recipe,
        profiles: profileData,
      }));
    },
  });

  const pendingRecipes = recipes?.filter((r) => r.status === "pending") || [];
  const approvedRecipes = recipes?.filter((r) => r.status === "approved") || [];
  const rejectedRecipes = recipes?.filter((r) => r.status === "rejected") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-4xl font-bold">My Recipes</h1>
          <Button onClick={() => navigate("/submit")}>
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({recipes?.length || 0})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedRecipes.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingRecipes.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedRecipes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
            ) : recipes && recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
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
                    authorUsername={recipe.profiles?.username || "You"}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-serif text-2xl font-semibold mb-2">No recipes yet</h3>
                <p className="text-muted-foreground mb-6">Start sharing your culinary creations!</p>
                <Button onClick={() => navigate("/submit")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Recipe
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedRecipes.map((recipe) => (
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
                    authorUsername={recipe.profiles?.username || "You"}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No approved recipes</p>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRecipes.map((recipe) => (
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
                    authorUsername={recipe.profiles?.username || "You"}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No pending recipes</p>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedRecipes.map((recipe) => (
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
                    authorUsername={recipe.profiles?.username || "You"}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No rejected recipes</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyRecipes;