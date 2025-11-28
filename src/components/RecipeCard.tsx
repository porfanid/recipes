import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  tags: string[] | null;
  authorUsername: string;
}

export const RecipeCard = ({
  id,
  title,
  description,
  imageUrl,
  prepTime,
  cookTime,
  servings,
  tags,
  authorUsername,
}: RecipeCardProps) => {
  const totalTime = (prepTime || 0) + (cookTime || 0);

  return (
    <Link to={`/recipe/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <span className="text-4xl">🍳</span>
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
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {totalTime > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
              </div>
            )}
            {servings && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{servings} servings</span>
              </div>
            )}
          </div>
        </CardContent>
        {tags && tags.length > 0 && (
          <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
};