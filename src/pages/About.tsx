import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ChefHat, Heart, Users, Leaf, UtensilsCrossed } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-warmth text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <ChefHat className="h-20 w-20 animate-fade-in" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 animate-fade-in text-balance">
            Welcome to Almondéa
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto animate-fade-in">
            A community-driven platform where passionate home cooks come together to share, discover, and celebrate the joy of cooking.
          </p>
          <Button asChild size="lg" variant="secondary" className="animate-fade-in">
            <Link to="/recipes" className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              View Recipes
            </Link>
          </Button>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Almondéa, we believe that cooking is more than just preparing food — it's about creating memories, sharing traditions, and bringing people together. Our mission is to build a vibrant community where everyone, from beginners to seasoned chefs, can share their culinary creations and discover new favorites.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Passion</h3>
              <p className="text-muted-foreground">
                We're driven by our love for cooking and the joy it brings to share delicious recipes with others.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Community</h3>
              <p className="text-muted-foreground">
                We believe in the power of community and bringing people together through the universal language of food.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Leaf className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Quality</h3>
              <p className="text-muted-foreground">
                We curate and feature only the best recipes, ensuring every dish shared meets our high standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold mb-6">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start exploring our collection of recipes or share your own culinary creations with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/recipes" className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Explore Recipes
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
