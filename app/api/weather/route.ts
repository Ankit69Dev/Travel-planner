import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { destination, startDate, endDate, lat, lng, days } = await request.json();

    console.log("🌤️ Generating weather forecast with Groq...");

    const start = new Date(startDate);
    const calculatedDays = days || Math.ceil((new Date(endDate).getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    const month = start.toLocaleString('default', { month: 'long' });
    const season = getSeason(start.getMonth());

    const prompt = `Generate a realistic weather forecast for ${destination} for a trip from ${startDate} to ${endDate} (${calculatedDays} days).

Location coordinates: ${lat}, ${lng}
Month: ${month}
Season: ${season}

Provide:
1. Current weather conditions
2. Daily forecast for ALL ${calculatedDays} days of the trip

IMPORTANT: Generate forecast for EXACTLY ${calculatedDays} days.

Format as JSON:
{
  "current": {
    "temp": 28,
    "feelsLike": 30,
    "condition": "Partly Cloudy",
    "description": "Warm with scattered clouds",
    "humidity": 65,
    "windSpeed": 12,
    "icon": "02d"
  },
  "forecast": [
    {
      "date": "${start.toLocaleDateString()}",
      "temp": 28,
      "minTemp": 22,
      "maxTemp": 32,
      "condition": "Sunny",
      "humidity": 60,
      "description": "Clear skies"
    }
  ]
}

Generate realistic temperatures for ${destination} in ${month}. Include ALL ${calculatedDays} days in forecast array.
Return ONLY JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a weather forecasting expert. Generate realistic weather data. Always return valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 3000,
    });

    const text = completion.choices[0].message.content || "";

    let weather;
    try {
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      weather = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse weather JSON:", text);
      weather = generateFallbackWeather(destination, start, calculatedDays);
    }

    // Ensure we have the correct number of forecast days
    if (weather.forecast && weather.forecast.length < calculatedDays) {
      console.warn(`⚠️ Weather only has ${weather.forecast.length} days, generating ${calculatedDays - weather.forecast.length} more...`);
      
      while (weather.forecast.length < calculatedDays) {
        const lastDay = weather.forecast[weather.forecast.length - 1];
        const nextDate = new Date(start.getTime() + weather.forecast.length * 24 * 60 * 60 * 1000);
        
        weather.forecast.push({
          date: nextDate.toLocaleDateString(),
          temp: lastDay.temp + Math.floor(Math.random() * 6) - 3,
          minTemp: lastDay.minTemp,
          maxTemp: lastDay.maxTemp,
          condition: lastDay.condition,
          humidity: lastDay.humidity,
          description: "Continued conditions",
        });
      }
    }

    console.log("✅ Weather forecast generated successfully");

    return NextResponse.json({ success: true, weather });
  } catch (error: any) {
    console.error("Weather API Error:", error);
    
    const { destination, startDate, endDate } = await request.json();
    const start = new Date(startDate);
    const days = Math.ceil((new Date(endDate).getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    
    const weather = generateFallbackWeather(destination, start, days);
    
    return NextResponse.json({ success: true, weather });
  }
}

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}

function generateFallbackWeather(destination: string, startDate: Date, days: number) {
  const baseTemp = 25;
  
  return {
    current: {
      temp: baseTemp,
      feelsLike: baseTemp + 2,
      condition: "Partly Cloudy",
      description: `Pleasant weather in ${destination}`,
      humidity: 65,
      windSpeed: 12,
      icon: "02d",
    },
    forecast: Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      return {
        date: date.toLocaleDateString(),
        temp: baseTemp + Math.floor(Math.random() * 6) - 3,
        minTemp: baseTemp - 5,
        maxTemp: baseTemp + 5,
        condition: ["Sunny", "Partly Cloudy", "Cloudy"][Math.floor(Math.random() * 3)],
        humidity: 60 + Math.floor(Math.random() * 20),
        description: "Pleasant day",
      };
    }),
  };
}