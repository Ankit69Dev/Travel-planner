import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    console.log("🖼️ Analyzing image for location with Groq Vision...");
    console.log("📊 Image size:", imageFile.size, "bytes");

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Use NEW Groq Vision Model - llama-3.2-11b-vision-preview
    console.log("🔍 Calling Groq Vision API with updated model...");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image carefully and identify the location or landmark.

Look for:
- Famous landmarks, monuments, buildings, or structures
- Architectural styles and unique features
- Natural landscapes (mountains, beaches, waterfalls, etc.)
- Street signs, text, or language on signs
- Cultural or regional characteristics
- Any identifiable geographical features

Provide a detailed analysis in this EXACT JSON format (no extra text):
{
  "location": "Specific landmark/place name or Unknown",
  "city": "City name or Unknown",
  "country": "Country name or Unknown",
  "confidence": "High" or "Medium" or "Low",
  "reasoning": "Detailed explanation of identification (2-3 sentences)",
  "landmarks": ["landmark1", "landmark2"],
  "lat": latitude_number_or_null,
  "lng": longitude_number_or_null,
  "category": "Historical Site" or "Natural Landmark" or "Modern Building" or "Religious Site" or "Cultural Site" or "Unknown"
}

IMPORTANT:
- Be specific with landmark names (e.g., "Taj Mahal" not just "marble building")
- Provide approximate coordinates if you know the location
- If unsure, set location to "Unknown" and confidence to "Low"
- Return ONLY valid JSON, no markdown, no extra text`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      model: "llama-3.2-11b-vision-preview", // UPDATED MODEL
      temperature: 0.2,
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content || "";
    console.log("🤖 Raw AI response:", responseText);

    // Clean response
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      console.error("Response was:", responseText);
      
      // Fallback
      result = {
        location: "Unknown",
        city: "Unknown",
        country: "Unknown",
        confidence: "Low",
        reasoning: "Unable to identify location from image. Image may not contain clear landmarks or identifiable features.",
        landmarks: [],
        lat: null,
        lng: null,
        category: "Unknown",
      };
    }

    // Validate and fill missing fields
    result = {
      location: result.location || "Unknown",
      city: result.city || "Unknown",
      country: result.country || "Unknown",
      confidence: result.confidence || "Low",
      reasoning: result.reasoning || "Analysis completed",
      landmarks: Array.isArray(result.landmarks) ? result.landmarks : [],
      lat: typeof result.lat === "number" ? result.lat : null,
      lng: typeof result.lng === "number" ? result.lng : null,
      category: result.category || "Unknown",
    };

    console.log("✅ Parsed result:", result);

    // If we have a location but no coordinates, try geocoding
    if (result.location !== "Unknown" && !result.lat && !result.lng) {
      try {
        console.log(`📍 Geocoding: "${result.location}, ${result.city}, ${result.country}"...`);
        
        const geocodeQuery = [result.location, result.city, result.country]
          .filter(x => x && x !== "Unknown")
          .join(", ");
        
        if (geocodeQuery) {
          const geocodeResponse = await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(geocodeQuery)}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}&limit=1&format=json`
          );

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.results && geocodeData.results.length > 0) {
              result.lat = geocodeData.results[0].lat;
              result.lng = geocodeData.results[0].lon;
              console.log(`✅ Geocoded coordinates: ${result.lat}, ${result.lng}`);
            }
          }
        }
      } catch (geocodeError) {
        console.warn("⚠️ Geocoding failed:", geocodeError);
        // Continue without coordinates
      }
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("❌ Location identification error:", error);
    console.error("Error message:", error.message);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to identify location",
      },
      { status: 500 }
    );
  }
}