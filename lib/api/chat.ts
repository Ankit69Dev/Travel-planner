import { Itinerary, Weather } from "../types";

export async function sendChatMessage(
  message: string,
  itinerary: Itinerary | null,
  weather: Weather | null
) {
  const context = itinerary
    ? `Current trip: ${itinerary.startLocation} to ${itinerary.destination}, ${itinerary.dates}, Budget: ${itinerary.budget}
Weather: ${weather ? `${weather.current.temp}°C, ${weather.current.condition}` : "Not loaded"}`
    : "No trip planned yet.";

  const prompt = `You are a helpful travel assistant. ${context}

User question: ${message}

Provide a helpful, concise response in PLAIN TEXT. Do NOT return JSON. Just respond naturally in plain English.`;

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error("Failed to send chat message");
  }

  // If response is JSON, extract the message
  let responseText = data.data;
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.message) {
      responseText = parsed.message;
    } else if (parsed.greeting) {
      responseText = `${parsed.greeting}. ${parsed.message || "How can I help you?"}`;
    }
  } catch (e) {
    // It's already plain text, use as is
  }

  return responseText;
}