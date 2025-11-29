import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { PackagingIdeaCard } from "@/components/PackagingIdeaCard";
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
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const MyPackagingIdeas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["my-packaging-ideas", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { data: ideasData, error: ideasError } = await supabase
        .from("packaging_ideas")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (ideasError) throw ideasError;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      return ideasData.map(idea => ({
        ...idea,
        profiles: profileData,
      }));
    },
    enabled: !!user,
  });

  const deleteIdea = useMutation({
    mutationFn: async (ideaId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("packaging_ideas")
        .delete()
        .eq("id", ideaId)
        .eq("author_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-packaging-ideas", user?.id] });
      toast({
        title: "Idea deleted",
        description: "Your packaging idea has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
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

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const handleDeleteClick = (ideaId: string) => {
    setIdeaToDelete(ideaId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ideaToDelete) {
      deleteIdea.mutate(ideaToDelete);
    }
  };

  const pendingIdeas = ideas?.filter((i) => i.status === "pending") || [];
  const approvedIdeas = ideas?.filter((i) => i.status === "approved") || [];
  const rejectedIdeas = ideas?.filter((i) => i.status === "rejected") || [];

  const renderIdeaCard = (idea: NonNullable<typeof ideas>[number]) => (
    <div key={idea.id} className="relative group">
      <PackagingIdeaCard
        id={idea.id}
        title={idea.title}
        description={idea.description}
        imageUrl={idea.image_url}
        materialsCount={idea.materials?.length || 0}
        stepsCount={idea.steps?.length || 0}
        authorUsername={idea.profiles?.username || "You"}
        authorAvatarUrl={idea.profiles?.avatar_url}
      />
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(`/packaging-idea/${idea.id}/edit`);
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
            handleDeleteClick(idea.id);
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
          <h1 className="font-serif text-4xl font-bold">My Packaging Ideas</h1>
          <Button onClick={() => navigate("/submit-packaging-idea")}>
            <Plus className="h-4 w-4 mr-2" />
            New Idea
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({ideas?.length || 0})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedIdeas.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingIdeas.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedIdeas.length})</TabsTrigger>
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
            ) : ideas && ideas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ideas.map(renderIdeaCard)}
              </div>
            ) : (
              <div className="text-center py-20">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-serif text-2xl font-semibold mb-2">No ideas yet</h3>
                <p className="text-muted-foreground mb-6">Start sharing your packaging repurposing ideas!</p>
                <Button onClick={() => navigate("/submit-packaging-idea")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Idea
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedIdeas.map(renderIdeaCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No approved ideas</p>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingIdeas.map(renderIdeaCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No pending ideas</p>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedIdeas.map(renderIdeaCard)}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">No rejected ideas</p>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteIdea.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default MyPackagingIdeas;
