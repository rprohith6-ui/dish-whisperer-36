import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dishName } = await req.json();
    
    if (!dishName || typeof dishName !== 'string' || dishName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dish name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating recipe for:', dishName);

    // Generate recipe using AI
    const recipeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional chef and recipe creator. Generate detailed, accurate recipes with exact measurements and clear instructions. Always respond in JSON format with this structure:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "prepTime": "X minutes",
  "cookTime": "X minutes",
  "servings": "X servings",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"]
}`
          },
          {
            role: 'user',
            content: `Create a complete recipe for: ${dishName}. Include exact measurements for all ingredients and detailed step-by-step instructions. Return only valid JSON.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!recipeResponse.ok) {
      const errorText = await recipeResponse.text();
      console.error('Recipe AI error:', recipeResponse.status, errorText);
      throw new Error(`Recipe generation failed: ${recipeResponse.status}`);
    }

    const recipeData = await recipeResponse.json();
    const recipeText = recipeData.choices?.[0]?.message?.content;
    
    if (!recipeText) {
      throw new Error('No recipe generated');
    }

    console.log('Raw recipe response:', recipeText);

    // Parse the recipe JSON
    let recipe;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = recipeText.match(/```json\s*([\s\S]*?)\s*```/);
      const cleanedText = jsonMatch ? jsonMatch[1] : recipeText.replace(/```/g, '').trim();
      recipe = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', parseError);
      throw new Error('Invalid recipe format received');
    }

    // Generate food image using AI
    const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Generate a beautiful, appetizing food photography image of ${dishName}. Professional lighting, restaurant quality plating, shallow depth of field, ultra high resolution.`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    let imageUrl = '';
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
      console.log('Image generated successfully');
    } else {
      console.warn('Image generation failed:', imageResponse.status);
    }

    console.log('Recipe generated successfully for:', dishName);

    return new Response(
      JSON.stringify({ 
        recipe,
        imageUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate recipe' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
