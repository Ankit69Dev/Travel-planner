import { TripData } from "../types";

export async function generateTransportDetails(tripData: TripData) {
  const transportPrompt = `Generate realistic transport details from ${tripData.startLocation?.name} to ${tripData.destination?.name} by ${tripData.transport}.

Trip details:
- From: ${tripData.startLocation?.name}
- To: ${tripData.destination?.name}
- Transport mode: ${tripData.transport}
- Budget: ${tripData.budget}
- Travelers: ${tripData.travelers}

Return ONLY a valid JSON object:
{
  "duration": "12h 30m",
  "cost": "₹1,500",
  "emissions": "15kg CO2",
  "departureTime": "08:00 AM",
  "arrivalTime": "08:30 PM",
  "route": "${tripData.startLocation?.name} → ${tripData.destination?.name}"
}`;

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: transportPrompt }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error("Failed to generate transport details");
  }

  console.log("🚂 Raw transport response:", result.data);

  const transportDetails = JSON.parse(result.data);
  console.log("✅ Transport parsed:", transportDetails);

  return transportDetails;
}