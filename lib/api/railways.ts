export async function generateRailwayRecommendations(
  startLocation: string,
  destination: string,
  budget: string
) {
  const railwayPrompt = `Generate 3 train recommendations from ${startLocation} to ${destination}.

Budget: ${budget}

Return ONLY a valid JSON array with NO extra text:
[
  {
    "trainName": "Train name",
    "trainNumber": "12345",
    "class": "AC 2-Tier",
    "price": "₹1,200",
    "duration": "12h 30m",
    "departureTime": "08:00 AM",
    "arrivalTime": "08:30 PM"
  }
]`;

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: railwayPrompt }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error("Failed to generate railway recommendations");
  }

  console.log("🚆 Raw railway response:", result.data);

  let railwayData = JSON.parse(result.data);

  if (!Array.isArray(railwayData)) {
    console.error("Railway data is not an array");
    railwayData = [];
  }

  console.log("✅ Railways parsed:", railwayData.length, "trains");

  return railwayData;
}