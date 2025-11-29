import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Trash2, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PackagingIdeaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["packaging-idea", id],
    queryFn: async () => {
      const { data: ideaData, error: ideaError } = await supabase
        .from("packaging_ideas")
        .select("*")
        .eq("id", id!)
        .single();

      if (ideaError) throw ideaError;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", ideaData.author_id)
        .single();

      if (profileError) throw profileError;

      return {
        ...ideaData,
        profiles: profileData,
      };
    },
    enabled: !!id,
  });

  const deleteIdea = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");

      const { error } = await supabase
        .from("packaging_ideas")
        .delete()
        .eq("id", id!)
        .eq("author_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-packaging-ideas"] });
      toast({
        title: "Idea deleted",
        description: "Your packaging idea has been deleted successfully.",
      });
      navigate("/my-packaging-ideas");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete idea. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const isOwner = user && idea?.author_id === user.id;

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

  if (!idea) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="font-serif text-3xl font-semibold mb-4">Idea not found</h1>
          <Button asChild>
            <Link to="/packaging-ideas">Back to ideas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate("/packaging-ideas")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {idea.image_url ? (
              <img
                src={idea.image_url}
                alt={idea.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-muted">
                <Package className="h-24 w-24 text-green-600" />
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif text-4xl font-bold mb-4">{idea.title}</h1>
            {idea.description && (
              <p className="text-lg text-muted-foreground mb-6">{idea.description}</p>
            )}

            <div className="flex items-center gap-6 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={idea.profiles?.avatar_url || undefined} alt={idea.profiles?.username || "User"} />
                  <AvatarFallback className="text-xs">
                    {idea.profiles?.username ? idea.profiles.username.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <span>by {idea.profiles?.username || "Unknown"}</span>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/packaging-idea/${id}/edit`)}
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
                        <AlertDialogTitle>Delete Idea</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this packaging idea? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteIdea.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteIdea.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl font-semibold mb-4">Materials</h2>
              <ul className="space-y-2">
                {idea.materials.map((material, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="font-serif text-2xl font-semibold mb-4">Steps</h2>
              <ol className="space-y-4">
                {idea.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
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

export default PackagingIdeaDetail;
