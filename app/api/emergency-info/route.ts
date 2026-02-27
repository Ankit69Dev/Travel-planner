import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { destination } = await request.json();

    console.log(`🚨 Fetching emergency contacts for: ${destination}`);

    const prompt = `Provide emergency contact numbers for ${destination}, India.

Return ONLY a valid JSON object with these fields:
{
  "police": "emergency police number",
  "ambulance": "emergency ambulance number",
  "fire": "fire department number",
  "tourist": "tourist helpline number with area code",
  "helpline": "general emergency helpline",
  "localPolice": "local police station number if available",
  "hospital": "major hospital contact if available"
}

Use actual, real emergency numbers for ${destination}. If you don't know specific local numbers, use India's national emergency numbers:
- Police: 100
- Ambulance: 108
- Fire: 101
- Tourist Helpline: 1363

IMPORTANT: Return ONLY valid JSON, no explanations.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an emergency services expert in India. Provide accurate emergency contact numbers. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 500,
    });

    let responseText = completion.choices[0].message.content || "";
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("🚨 Emergency contacts response:", responseText);

    const contacts = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error: any) {
    console.error("Emergency contacts API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        contacts: {
          police: "100",
          ambulance: "108",
          fire: "101",
          tourist: "1363",
          helpline: "1363",
        },
      },
      { status: 500 }
    );
  }
}