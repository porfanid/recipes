import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AdminPendingRecipes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");

  const { data: pendingRecipes, isLoading } = useQuery({
    queryKey: ["admin-pending-recipes"],
    queryFn: async () => {
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes: string }) => {
      const { error } = await supabase
        .from("recipes")
        .update({
          status,
          moderator_notes: notes,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-recipes"] });
      toast({
        title: variables.status === "approved" ? "Recipe approved" : "Recipe rejected",
        description: `The recipe has been ${variables.status}`,
      });
      setSelectedRecipe(null);
      setModeratorNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update recipe status",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!pendingRecipes || pendingRecipes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No pending recipes to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingRecipes.map((recipe) => {
          const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

          return (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                    <span className="text-6xl">🍳</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="font-serif">{recipe.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  by {recipe.profiles?.username || "Unknown"}
                </p>
              </CardHeader>
              <CardContent>
                {recipe.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {recipe.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{totalTime} min</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{recipe.servings}</span>
                    </div>
                  )}
                </div>
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecipe(recipe)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    updateStatus.mutate({
                      id: recipe.id,
                      status: "approved",
                      notes: "",
                    })
                  }
                  disabled={updateStatus.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {selectedRecipe?.title}
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedRecipe?.profiles?.username || "Unknown"}
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-6">
              {selectedRecipe.image_url && (
                <img
                  src={selectedRecipe.image_url}
                  alt={selectedRecipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              {selectedRecipe.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedRecipe.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="space-y-1">
                  {selectedRecipe.ingredients.map((ingredient: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="space-y-2">
                  {selectedRecipe.steps.map((step: string, i: number) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="font-semibold">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Moderator Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Add notes for rejection or approval..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() =>
                    updateStatus.mutate({
                      id: selectedRecipe.id,
                      status: "approved",
                      notes: moderatorNotes,
                    })
                  }
                  disabled={updateStatus.isPending}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    updateStatus.mutate({
                      id: selectedRecipe.id,
                      status: "rejected",
                      notes: moderatorNotes,
                    })
                  }
                  disabled={updateStatus.isPending}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};