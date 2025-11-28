import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, ArrowLeft, Bookmark, Flag, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id!)
        .single();

      if (recipeError) throw recipeError;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", recipeData.author_id)
        .single();

      if (profileError) throw profileError;

      return {
        ...recipeData,
        profiles: profileData,
      };
    },
    enabled: !!id,
  });

  const { data: isSaved, isLoading: savedLoading } = useQuery({
    queryKey: ["saved", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("id")
        .eq("user_id", user.id)
        .eq("recipe_id", id!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!id,
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      if (isSaved) {
        const { error } = await supabase
          .from("saved_recipes")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_recipes")
          .insert({ user_id: user.id, recipe_id: id! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved", id, user?.id] });
      toast({
        title: isSaved ? "Removed from saved" : "Saved!",
        description: isSaved ? "Recipe removed from your saved list" : "Recipe saved to your collection",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save recipe",
        variant: "destructive",
      });
    },
  });

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase.from("recipe_reports").insert({
        recipe_id: id!,
        reporter_id: user.id,
        reason: reportReason as any,
        details: reportDetails,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setReportDialogOpen(false);
      setReportReason("");
      setReportDetails("");
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit report";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id!)
        .eq("author_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-recipes"] });
      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted successfully.",
      });
      navigate("/my-recipes");
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

  const isOwner = user && recipe?.author_id === user.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-20 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-serif text-3xl font-semibold mb-4">Recipe not found</h1>
          <Button asChild>
            <Link to="/">Back to recipes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
                <span className="text-8xl">🍳</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif text-4xl font-bold mb-4">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>
            )}

            <div className="flex items-center gap-6 mb-6 text-sm">
              {totalTime > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{totalTime} minutes</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={recipe.profiles?.avatar_url || undefined} alt={recipe.profiles?.username || "User"} />
                  <AvatarFallback className="text-xs">
                    {recipe.profiles?.username ? recipe.profiles.username.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <span>by {recipe.profiles?.username || "Unknown"}</span>
              </div>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {user && (
                <Button
                  variant={isSaved ? "default" : "outline"}
                  onClick={() => toggleSave.mutate()}
                  disabled={savedLoading || toggleSave.isPending}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save Recipe"}
                </Button>
              )}

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/recipe/${id}/edit`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
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
                          onClick={() => deleteRecipe.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteRecipe.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {user && recipe.author_id !== user.id && (
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Recipe</DialogTitle>
                      <DialogDescription>
                        Help us keep the community safe by reporting inappropriate content
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label>Reason</Label>
                        <RadioGroup value={reportReason} onValueChange={setReportReason}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spam" id="spam" />
                            <Label htmlFor="spam" className="font-normal cursor-pointer">Spam</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="offensive" id="offensive" />
                            <Label htmlFor="offensive" className="font-normal cursor-pointer">Offensive content</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dangerous" id="dangerous" />
                            <Label htmlFor="dangerous" className="font-normal cursor-pointer">Dangerous instructions</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="copyright" id="copyright" />
                            <Label htmlFor="copyright" className="font-normal cursor-pointer">Copyright infringement</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="details">Additional details</Label>
                        <Textarea
                          id="details"
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Please provide more information..."
                          rows={4}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => submitReport.mutate()}
                        disabled={!reportReason || submitReport.isPending}
                      >
                        Submit Report
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl font-semibold mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl font-semibold mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;