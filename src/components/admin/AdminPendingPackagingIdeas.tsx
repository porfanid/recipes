import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Eye, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PackagingIdeaWithProfile {
  id: string;
  title: string;
  description: string | null;
  materials: string[];
  steps: string[];
  image_url: string | null;
  author_id: string;
  profiles?: { id: string; username: string } | undefined;
}

export const AdminPendingPackagingIdeas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIdea, setSelectedIdea] = useState<PackagingIdeaWithProfile | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState("");

  const { data: pendingIdeas, isLoading } = useQuery({
    queryKey: ["admin-pending-packaging-ideas"],
    queryFn: async () => {
      const { data: ideasData, error: ideasError } = await supabase
        .from("packaging_ideas")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (ideasError) throw ideasError;

      const authorIds = [...new Set(ideasData?.map(r => r.author_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return ideasData?.map(idea => ({
        ...idea,
        profiles: profilesMap.get(idea.author_id),
      })) || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes: string }) => {
      const { error } = await supabase
        .from("packaging_ideas")
        .update({
          status,
          moderator_notes: notes,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-packaging-ideas"] });
      toast({
        title: variables.status === "approved" ? "Idea approved" : "Idea rejected",
        description: `The packaging idea has been ${variables.status}`,
      });
      setSelectedIdea(null);
      setModeratorNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update idea status",
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

  if (!pendingIdeas || pendingIdeas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No pending packaging ideas to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingIdeas.map((idea) => (
          <Card key={idea.id} className="overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {idea.image_url ? (
                <img
                  src={idea.image_url}
                  alt={idea.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-muted">
                  <Package className="h-16 w-16 text-green-600" />
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="font-serif">{idea.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {idea.profiles?.username || "Unknown"}
              </p>
            </CardHeader>
            <CardContent>
              {idea.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {idea.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{idea.materials?.length || 0} materials</span>
                <span>{idea.steps?.length || 0} steps</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIdea(idea)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({
                    id: idea.id,
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
        ))}
      </div>

      <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {selectedIdea?.title}
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedIdea?.profiles?.username || "Unknown"}
            </DialogDescription>
          </DialogHeader>

          {selectedIdea && (
            <div className="space-y-6">
              {selectedIdea.image_url && (
                <img
                  src={selectedIdea.image_url}
                  alt={selectedIdea.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              {selectedIdea.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedIdea.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Materials</h3>
                <ul className="space-y-1">
                  {selectedIdea.materials.map((material, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      {material}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="space-y-2">
                  {selectedIdea.steps.map((step, i) => (
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
                      id: selectedIdea.id,
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
                      id: selectedIdea.id,
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
