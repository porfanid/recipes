import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PackagingIdeaCard } from "@/components/PackagingIdeaCard";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PackagingIdeasIndex = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["packaging-ideas", "approved"],
    queryFn: async () => {
      const { data: ideasData, error: ideasError } = await supabase
        .from("packaging_ideas")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (ideasError) throw ideasError;

      // Fetch profiles for all authors
      const authorIds = [...new Set(ideasData?.map(r => r.author_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", authorIds);

      if (profilesError) throw profilesError;

      // Map profiles to ideas
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return ideasData?.map(idea => ({
        ...idea,
        profiles: profilesMap.get(idea.author_id),
      })) || [];
    },
  });

  const filteredIdeas = ideas?.filter((idea) => {
    const query = searchQuery.toLowerCase();
    return (
      idea.title.toLowerCase().includes(query) ||
      idea.description?.toLowerCase().includes(query) ||
      idea.materials?.some((material) => material.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Package className="h-16 w-16 animate-fade-in" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4 animate-fade-in text-balance">
            Packaging Repurposing Ideas
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto animate-fade-in">
            Discover creative ways to repurpose packaging materials and reduce waste
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative animate-fade-in">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search ideas, materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg bg-white/95 backdrop-blur-sm text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Ideas Grid */}
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
        ) : filteredIdeas && filteredIdeas.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-3xl font-semibold">
                {searchQuery ? "Search Results" : "Latest Ideas"}
              </h2>
              <p className="text-muted-foreground">
                {filteredIdeas.length} {filteredIdeas.length === 1 ? "idea" : "ideas"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIdeas.map((idea) => (
                <PackagingIdeaCard
                  key={idea.id}
                  id={idea.id}
                  title={idea.title}
                  description={idea.description}
                  imageUrl={idea.image_url}
                  materialsCount={idea.materials?.length || 0}
                  stepsCount={idea.steps?.length || 0}
                  authorUsername={idea.profiles?.username || "Unknown"}
                  authorAvatarUrl={idea.profiles?.avatar_url}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-serif text-2xl font-semibold mb-2">
              {searchQuery ? "No ideas found" : "No ideas yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Be the first to share a packaging repurposing idea!"}
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

export default PackagingIdeasIndex;
