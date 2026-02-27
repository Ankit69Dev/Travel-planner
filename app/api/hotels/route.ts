import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, checkIn, checkOut, budget } = await request.json();

    console.log("🏨 Generating hotel recommendations with Groq...");

    const prompt = `Generate 3 realistic hotel recommendations for ${destination} with the following details:
- Budget level: ${budget}
- Check-in: ${checkIn}
- Check-out: ${checkOut}

For each hotel, provide:
1. Hotel name (realistic, sounds like a real hotel in ${destination})
2. Price per night in INR (based on ${budget} budget: Low = ₹800-1500, Moderate = ₹2000-4000, High = ₹5000-8000)
3. Rating (out of 5)
4. Address/Location in ${destination}
5. Brief amenities description

Format as JSON array:
[
  {
    "name": "Hotel Name",
    "price": "₹2,500/night",
    "rating": "4.2",
    "address": "Location description",
    "amenities": "Brief amenities list"
  }
]

Return ONLY the JSON array, no other text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 1500,
    });

    const text = completion.choices[0].message.content || "";

    // Parse JSON from response
    let hotels;
    try {
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      hotels = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse hotel JSON:", text);
      // Fallback
      hotels = [
        {
          name: `The Grand ${destination} Hotel`,
          price: budget === "High" ? "₹6,500/night" : budget === "Moderate" ? "₹2,800/night" : "₹1,200/night",
          rating: "4.5",
          address: `${destination} City Center`,
          amenities: "WiFi, Pool, Restaurant, Gym",
        },
      ];
    }

    console.log(`✅ Generated ${hotels.length} hotels`);

    return NextResponse.json({ success: true, hotels });
  } catch (error: any) {
    console.error("Hotels API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}