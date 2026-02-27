import { TripData } from "../types";

export async function generateDailyItinerary(
  tripData: TripData,
  days: number,
  startDate: Date
) {
  console.log(`📅 Generating ${days}-day itinerary...`);

  const itineraryPrompt = `Create a ${days}-day travel itinerary for ${tripData.destination?.name}.

CRITICAL: Generate EXACTLY ${days} days, no more, no less.

Trip details:
- Destination: ${tripData.destination?.name}
- Duration: ${days} days
- Travelers: ${tripData.travelers}
- Budget: ${tripData.budget}
- Start date: ${tripData.startDate}
- End date: ${tripData.endDate}

Return ONLY a valid JSON array with EXACTLY ${days} day objects:
[
  {
    "day": 1,
    "date": "${startDate.toLocaleDateString()}",
    "activities": [
      { "time": "09:00 AM", "activity": "Specific activity", "cost": "₹300" },
      { "time": "11:00 AM", "activity": "Another activity", "cost": "₹500" },
      { "time": "02:00 PM", "activity": "Lunch", "cost": "₹400" },
      { "time": "04:00 PM", "activity": "Afternoon", "cost": "₹200" },
      { "time": "07:00 PM", "activity": "Evening", "cost": "₹600" }
    ]
  }
]

IMPORTANT: Return ONLY the JSON array. No explanations, no markdown, no extra text.`;

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: itineraryPrompt }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error("Failed to generate itinerary");
  }

  console.log("📅 Raw itinerary response:", result.data);

  let dailyPlan;
  
  try {
    // Try to parse directly first
    dailyPlan = JSON.parse(result.data);
  } catch (firstError) {
    console.warn("⚠️ First parse attempt failed, cleaning data...");
    
    try {
      // Clean the data more aggressively
      let cleanedData = result.data.trim();
      
      // Remove any markdown
      cleanedData = cleanedData.replace(/```json/g, "").replace(/```/g, "");
      
      // Remove any non-JSON text before the array
      const arrayStart = cleanedData.indexOf('[');
      const arrayEnd = cleanedData.lastIndexOf(']');
      
      if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error("No valid JSON array found in response");
      }
      
      cleanedData = cleanedData.substring(arrayStart, arrayEnd + 1);
      
      // Remove any control characters or hidden characters
      cleanedData = cleanedData.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
      
      console.log("📅 Cleaned data:", cleanedData);
      
      dailyPlan = JSON.parse(cleanedData);
    } catch (secondError: any) {
      console.error("❌ Failed to parse even after cleaning:", secondError);
      console.error("Raw data:", result.data);
      throw new Error(`Failed to parse itinerary: ${secondError.message}. Check console for raw data.`);
    }
  }

  if (!Array.isArray(dailyPlan)) {
    throw new Error("Itinerary is not an array");
  }

  console.log("📅 Parsed", dailyPlan.length, "days from AI");

  // Only keep the exact number of days needed
  dailyPlan = dailyPlan.slice(0, days);

  // Validate and fix structure
  dailyPlan = dailyPlan.map((day: any, index: number) => {
    if (!day.day) day.day = index + 1;

    if (!day.date) {
      const dayDate = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000);
      day.date = dayDate.toLocaleDateString();
    }

    if (!day.activities || !Array.isArray(day.activities) || day.activities.length === 0) {
      console.warn(`⚠️ Day ${day.day} has no activities, adding defaults`);
      day.activities = [
        { time: "09:00 AM", activity: `Morning in ${tripData.destination?.name}`, cost: "₹300" },
        { time: "11:00 AM", activity: `Sightseeing`, cost: "₹500" },
        { time: "02:00 PM", activity: "Lunch", cost: "₹400" },
        { time: "04:00 PM", activity: "Explore", cost: "₹200" },
        { time: "07:00 PM", activity: "Dinner", cost: "₹600" },
      ];
    }

    day.activities = day.activities.map((activity: any) => {
      if (!activity.time) activity.time = "09:00 AM";
      if (!activity.activity) activity.activity = "Activity";
      if (!activity.cost) activity.cost = "₹0";
      return activity;
    });

    return day;
  });

  // Add missing days if needed
  while (dailyPlan.length < days) {
    const missingDay = dailyPlan.length + 1;
    const missingDate = new Date(startDate.getTime() + (missingDay - 1) * 24 * 60 * 60 * 1000);
    console.warn(`⚠️ Adding missing day ${missingDay}`);
    dailyPlan.push({
      day: missingDay,
      date: missingDate.toLocaleDateString(),
      activities: [
        { time: "09:00 AM", activity: `Morning`, cost: "₹300" },
        { time: "11:00 AM", activity: "Sightseeing", cost: "₹500" },
        { time: "02:00 PM", activity: "Lunch", cost: "₹400" },
        { time: "04:00 PM", activity: "Activities", cost: "₹200" },
        { time: "07:00 PM", activity: "Dinner", cost: "₹600" },
      ],
    });
  }

  console.log(`✅ Final validated itinerary: ${dailyPlan.length} days`);

  return dailyPlan;
}