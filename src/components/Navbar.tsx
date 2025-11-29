import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { ChefHat, Plus, LogOut, Shield, UtensilsCrossed, Settings, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { data: isAdmin } = useUserRole();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getAvatarFallback = () => {
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-semibold">Almondéa</span>
        </Link>
        
        <Button asChild variant="ghost" size="sm">
            <Link to="/" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              About Us
            </Link>
          </Button>
        
        <Button asChild variant="ghost" size="sm">
            <Link to="/recipes" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              View Recipes
            </Link>
          </Button>

        <div className="flex items-center gap-4">

          {user ? (
            <>
              <Button asChild variant="default" size="sm">
                <Link to="/submit" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Recipe
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || "User"} />
                      <AvatarFallback className="text-sm">
                        {getAvatarFallback()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-recipes">My Recipes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/saved">Saved Recipes</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
