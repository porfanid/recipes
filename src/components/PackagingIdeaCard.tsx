import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Package } from "lucide-react";

interface PackagingIdeaCardProps {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  materialsCount: number;
  stepsCount: number;
  authorUsername: string;
  authorAvatarUrl?: string | null;
}

export const PackagingIdeaCard = ({
  id,
  title,
  description,
  imageUrl,
  materialsCount,
  stepsCount,
  authorUsername,
  authorAvatarUrl,
}: PackagingIdeaCardProps) => {
  return (
    <Link to={`/packaging-idea/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-muted">
              <Package className="h-16 w-16 text-green-600" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{materialsCount} {materialsCount === 1 ? "material" : "materials"}</span>
              <span>{stepsCount} {stepsCount === 1 ? "step" : "steps"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={authorAvatarUrl || undefined} alt={authorUsername} />
                <AvatarFallback className="text-xs">
                  {authorUsername ? authorUsername.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{authorUsername}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
