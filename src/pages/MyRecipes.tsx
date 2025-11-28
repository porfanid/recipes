import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, UtensilsCrossed, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MyRecipes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);

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
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      return recipesData.map(recipe => ({
        ...recipe,
        profiles: profileData,
      }));
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("author_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recipes", user.id] });
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setRecipeToDelete(null);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete recipe. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (recipeId: string) => {
    setRecipeToDelete(recipeId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (recipeToDelete) {
      deleteRecipe.mutate(recipeToDelete);
    }
  };

  const pendingRecipes = recipes?.filter((r) => r.status === "pending") || [];
  const approvedRecipes = recipes?.filter((r) => r.status === "approved") || [];
  const rejectedRecipes = recipes?.filter((r) => r.status === "rejected") || [];

  const renderRecipeCard = (recipe: NonNullable<typeof recipes>[number]) => (
    <div key={recipe.id} className="relative group">
      <RecipeCard
        id={recipe.id}
        title={recipe.title}
        description={recipe.description}
        imageUrl={recipe.image_url}
        prepTime={recipe.prep_time}
        cookTime={recipe.cook_time}
        servings={recipe.servings}
        tags={recipe.tags}
        authorUsername={recipe.profiles?.username || "You"}
        authorAvatarUrl={recipe.profiles?.avatar_url}
      />
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/recipe/${recipe.id}/edit`);
          }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(recipe.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

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
                {recipes.map(renderRecipeCard)}
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
                {approvedRecipes.map(renderRecipeCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No approved recipes</p>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRecipes.map(renderRecipeCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No pending recipes</p>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedRecipes.map(renderRecipeCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No rejected recipes</p>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this recipe? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteRecipe.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MyRecipes;