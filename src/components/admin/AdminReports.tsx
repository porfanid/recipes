import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Check, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export const AdminReports = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data: reportsData, error: reportsError } = await supabase
        .from("recipe_reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (reportsError) throw reportsError;

      // Fetch recipe details
      const recipeIds = [...new Set(reportsData?.map(r => r.recipe_id) || [])];
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("id, title, author_id")
        .in("id", recipeIds);

      if (recipesError) throw recipesError;

      // Fetch reporter profiles
      const reporterIds = [...new Set(reportsData?.map(r => r.reporter_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", reporterIds);

      if (profilesError) throw profilesError;

      const recipesMap = new Map(recipesData?.map(r => [r.id, r]) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return reportsData?.map(report => ({
        ...report,
        recipe: recipesMap.get(report.recipe_id),
        reporter: profilesMap.get(report.reporter_id),
      })) || [];
    },
  });

  const resolveReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("recipe_reports")
        .update({ status: "resolved" })
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Check className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-serif text-xl font-semibold mb-2">All clear!</h3>
          <p className="text-muted-foreground">No pending reports</p>
        </CardContent>
      </Card>
    );
  }

  const reasonLabels: Record<string, string> = {
    spam: "Spam",
    offensive: "Offensive Content",
    dangerous: "Dangerous Instructions",
    copyright: "Copyright Infringement",
    other: "Other",
  };

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Report: {report.recipe?.title || "Unknown Recipe"}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reported by {report.reporter?.username || "Unknown"} •{" "}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant="destructive">{reasonLabels[report.reason] || report.reason}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.details && (
              <div>
                <p className="text-sm font-medium mb-1">Details:</p>
                <p className="text-sm text-muted-foreground">{report.details}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
              >
                <Link to={`/recipe/${report.recipe_id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Recipe
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => resolveReport.mutate(report.id)}
                disabled={resolveReport.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark Resolved
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};