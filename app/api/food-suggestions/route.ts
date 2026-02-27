import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, budget } = await request.json();

    console.log(`🍽️ Generating food suggestions for: ${destination}`);

    const prompt = `Generate food and cuisine recommendations for ${destination}, India with ${budget} budget.

Provide 8-10 local food items/dishes that travelers must try. Include:
- Street food
- Local specialties
- Popular restaurants/eateries
- Traditional dishes
- Price range appropriate for ${budget} budget

Return ONLY a valid JSON array:
[
  {
    "name": "Dish/Food name",
    "description": "Brief description (20-30 words)",
    "type": "Street Food/Restaurant/Cafe/Sweet Shop/etc",
    "priceRange": "₹50-100" or "₹200-500" etc,
    "mustTry": true/false,
    "vegetarian": true/false,
    "location": "Famous place/area where to find it"
  }
]

Focus on authentic local cuisine. Be specific about ${destination}.

IMPORTANT: Return ONLY valid JSON array, no extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a food and cuisine expert specializing in Indian regional cuisines. Provide accurate local food recommendations. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
    });

    let responseText = completion.choices[0].message.content || "";
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("🍽️ Food suggestions response:", responseText);

    const suggestions = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error("Food suggestions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        suggestions: [],
      },
      { status: 500 }
    );
  }
}