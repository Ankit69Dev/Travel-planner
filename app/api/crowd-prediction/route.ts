import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, startDate, endDate } = await request.json();

    console.log(`👥 Predicting crowd for: ${destination} from ${startDate} to ${endDate}`);

    const prompt = `Analyze crowd levels for ${destination}, India during ${startDate} to ${endDate}.

Consider:
1. Festivals and religious events during this period
2. School/college holidays
3. Weather conditions and tourist season
4. Local events and celebrations
5. Public holidays in India

Return ONLY a valid JSON object:
{
  "level": "🔴 Very High" OR "🟠 High" OR "🟡 Moderate" OR "🟢 Low",
  "description": "Brief explanation of why this crowd level (mention specific festivals/events if any)",
  "tips": "Practical tip for travelers visiting during this time",
  "festivals": ["list of festivals/events during this period"],
  "bestTimeToVisit": "suggestion for best time to visit popular spots"
}

Be specific about festivals and events. If Holi, Diwali, Eid, Christmas, or regional festivals fall in this date range, mention them.

IMPORTANT: Return ONLY valid JSON, no extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert on Indian tourism, festivals, and crowd patterns. Provide accurate crowd predictions based on festivals, holidays, and seasons. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 700,
    });

    let responseText = completion.choices[0].message.content || "";
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("👥 Crowd prediction response:", responseText);

    const prediction = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error("Crowd prediction API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        prediction: {
          level: "🟡 Moderate",
          description: "Tourist season with moderate crowds",
          tips: "Book accommodations in advance",
          festivals: [],
          bestTimeToVisit: "Early morning or late evening",
        },
      },
      { status: 500 }
    );
  }
}