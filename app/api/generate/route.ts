import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    console.log("🚀 Calling Groq API...");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a JSON-only API. You ONLY respond with valid JSON. No explanations, no markdown, no text outside JSON. Just pure, valid JSON with no special characters or control characters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 3000,
    });

    let text = completion.choices[0].message.content || "";

    console.log("📦 Groq raw response:", text);

    // Clean the response thoroughly
    text = text.trim();
    
    // Remove markdown code blocks
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").replace(/```/g, "");
    
    // Remove any control characters
    text = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    
    // Try to extract JSON
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    const objectMatch = text.match(/\{[\s\S]*\}/);
    
    const arrayIndex = text.indexOf('[');
    const objectIndex = text.indexOf('{');
    
    if (arrayIndex !== -1 && (arrayIndex < objectIndex || objectIndex === -1)) {
      if (arrayMatch) {
        text = arrayMatch[0];
      }
    } else if (objectIndex !== -1) {
      if (objectMatch) {
        text = objectMatch[0];
      }
    }

    console.log("✅ Cleaned response:", text);

    return NextResponse.json({ success: true, data: text });
  } catch (error: any) {
    console.error("❌ Groq API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}