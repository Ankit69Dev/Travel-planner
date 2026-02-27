export async function generateFoodSuggestions(destination: string, budget: string) {
  try {
    console.log(`🍽️ Generating food suggestions for ${destination}...`);

    const response = await fetch("/api/food-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, budget }),
    });

    const data = await response.json();

    if (data.success) {
      return data.suggestions;
    }

    return [];
  } catch (error) {
    console.error("Error generating food suggestions:", error);
    return [];
  }
}