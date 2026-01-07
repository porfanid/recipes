import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Heart, Users, Leaf, UtensilsCrossed, Package } from "lucide-react";
import almondeaLogo from "@/images/ALMONDEA PNG .png";
import bottleImage from "@/images/bottle.png";
import bottleStrawberryImage from "@/images/bottle strawberry.png";
import kefirGrainsImage from "@/images/kefir grains.jpg";
import almondsImage from "@/images/almonds.jpg";
import instagramQR from "@/images/instagram_qr.png";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-warmth text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <img src={almondeaLogo} alt="Almondéa" className="h-32 w-auto animate-fade-in" />
          </div>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto animate-fade-in">
            A community-driven platform where Almondea lovers can share their favorite Almondea-based recipes and their ideas for the repurposing of the Almondea package.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button asChild size="lg" variant="secondary">
              <Link to="/recipes" className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                View Recipes
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/packaging-repurposing" className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Packaging Repurposing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Product Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-4xl font-bold mb-6 text-center">Our Product</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-full md:w-1/4">
                <img src={bottleImage} alt="Almondéa Bottle" className="w-full h-auto object-contain rounded-lg" />
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Almondéa is an innovative almond-based kefir beverage that consists of minimal, natural and locally harvested ingredients.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-1/4">
                <img src={bottleStrawberryImage} alt="Almondéa Strawberry Bottle" className="w-full h-auto object-contain rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-serif text-4xl font-bold mb-6 text-center">Our Mission</h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 w-full md:w-1/4">
                <img src={kefirGrainsImage} alt="Kefir Grains" className="w-full h-auto object-cover rounded-lg aspect-square" />
              </div>
              <div className="flex-1 text-center">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  This blog is a space for consumers to familiarize themselves with our product and its health benefits.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-1/4">
                <img src={almondsImage} alt="Almonds" className="w-full h-auto object-cover rounded-lg aspect-square" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-4xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Passion</h3>
              <p className="text-muted-foreground">
                The project is driven by the mission to serve health-conscious individuals and individuals with dietary restrictions.
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
                Almondéa has overtaken the challenge of proving that functional health products can be both delicious and ethically produced.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold mb-6">Join Our Community</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign Up</Link>
            </Button>
          </div>
          <div className="flex flex-col items-center gap-4 mt-8">
            <p className="text-lg text-muted-foreground">Find us on our Instagram</p>
            <a 
              href="https://www.instagram.com/almondea.kefir?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src={instagramQR} alt="Instagram QR Code" className="w-48 h-48 object-contain" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
