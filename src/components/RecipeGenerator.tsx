import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
}

export const RecipeGenerator = () => {
  const [dishName, setDishName] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState("");

  const generateRecipe = async () => {
    if (!dishName.trim()) {
      toast.error("Please enter a dish name");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: { dishName: dishName.trim() }
      });

      if (error) throw error;

      if (data.recipe) {
        setRecipe(data.recipe);
        setBackgroundImage(data.imageUrl || "");
        toast.success("Recipe generated!");
      }
    } catch (error) {
      console.error('Error generating recipe:', error);
      toast.error("Failed to generate recipe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      generateRecipe();
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-700"
      style={{
        backgroundImage: backgroundImage 
          ? `linear-gradient(to bottom, rgba(35, 25, 15, 0.7), rgba(35, 25, 15, 0.85)), url(${backgroundImage})`
          : 'var(--gradient-warm)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChefHat className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">Recipe Generator</h1>
          </div>
          <p className="text-white/90 text-lg">
            Enter any dish name and get a complete recipe with ingredients and instructions
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8 animate-in fade-in slide-in-from-top duration-700 delay-100">
          <Card className="shadow-recipe border-0">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="e.g., Spaghetti Carbonara, Chicken Curry, Chocolate Cake..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-lg h-14 border-2 border-border focus:border-primary transition-colors"
                  disabled={isLoading}
                />
                <Button 
                  onClick={generateRecipe}
                  disabled={isLoading}
                  size="lg"
                  className="h-14 px-8 bg-gradient-warm hover:opacity-90 transition-opacity shadow-recipe"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Recipe'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Display */}
        {recipe && (
          <Card className="shadow-recipe border-0 animate-in fade-in slide-in-from-bottom duration-700">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-2 text-foreground">{recipe.title}</h2>
              {recipe.description && (
                <p className="text-muted-foreground mb-6 text-lg">{recipe.description}</p>
              )}

              {/* Recipe Meta */}
              {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
                  {recipe.prepTime && (
                    <div className="bg-secondary px-4 py-2 rounded-lg">
                      <span className="font-semibold text-secondary-foreground">Prep: </span>
                      <span className="text-secondary-foreground">{recipe.prepTime}</span>
                    </div>
                  )}
                  {recipe.cookTime && (
                    <div className="bg-secondary px-4 py-2 rounded-lg">
                      <span className="font-semibold text-secondary-foreground">Cook: </span>
                      <span className="text-secondary-foreground">{recipe.cookTime}</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="bg-secondary px-4 py-2 rounded-lg">
                      <span className="font-semibold text-secondary-foreground">Servings: </span>
                      <span className="text-secondary-foreground">{recipe.servings}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Ingredients */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li 
                      key={index}
                      className="flex items-start gap-3 text-foreground"
                    >
                      <span className="text-primary text-xl">•</span>
                      <span className="text-lg">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li 
                      key={index}
                      className="flex gap-4"
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-lg text-foreground pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
