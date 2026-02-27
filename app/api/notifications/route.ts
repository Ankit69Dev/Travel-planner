import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userLocation } = await request.json();

    console.log("🔔 Generating notifications for location:", userLocation);

    const currentDate = new Date();
    const nextThreeMonths = new Date();
    nextThreeMonths.setMonth(currentDate.getMonth() + 3);

    const prompt = `Generate travel suggestions based on upcoming festivals and events in India from ${currentDate.toLocaleDateString()} to ${nextThreeMonths.toLocaleDateString()}.

Current date: ${currentDate.toLocaleDateString()}
User location: ${userLocation || "India"}

Consider:
1. Major Indian festivals (Holi, Diwali, Eid, Christmas, Navratri, Durga Puja, etc.)
2. Regional festivals and events
3. Weather-based travel suggestions
4. Long weekends and holidays
5. Cultural events and celebrations

Return ONLY a valid JSON array with 3-5 notifications:
[
  {
    "id": 1,
    "title": "Festival/Event Name",
    "message": "Engaging message suggesting where to visit and why (40-60 words)",
    "destination": "City/Place name",
    "date": "YYYY-MM-DD (event date)",
    "icon": "appropriate emoji (🎨, 🪔, 🎆, 🕉️, ⛰️, 🏖️, etc.)",
    "category": "festival/seasonal/cultural/adventure"
  }
]

Make messages personalized and exciting. Include specific destinations and what makes them special during that time.

IMPORTANT: Return ONLY valid JSON array, no extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a travel expert specializing in Indian festivals, events, and seasonal destinations. Generate personalized travel suggestions based on upcoming events. Always return valid JSON only.",
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

    console.log("🔔 Notifications response:", responseText);

    const notifications = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    console.error("Notifications API error:", error);
    
    // Fallback notifications
    return NextResponse.json(
      {
        success: true,
        notifications: [
          {
            id: 1,
            title: "Upcoming Festivals",
            message: "Plan your trip around upcoming Indian festivals for unique cultural experiences",
            destination: "India",
            date: new Date().toISOString().split('T')[0],
            icon: "🎉",
            category: "festival",
          },
        ],
      },
      { status: 200 }
    );
  }
}