// This file now uses AI to fetch emergency contacts and crowd predictions

export async function getEmergencyContactsAI(destination: string) {
  try {
    const response = await fetch("/api/emergency-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination }),
    });

    const data = await response.json();

    if (data.success) {
      return data.contacts;
    }

    // Fallback to default
    return {
      police: "100",
      ambulance: "108",
      fire: "101",
      tourist: "1363",
      helpline: "1363",
    };
  } catch (error) {
    console.error("Error fetching emergency contacts:", error);
    return {
      police: "100",
      ambulance: "108",
      fire: "101",
      tourist: "1363",
      helpline: "1363",
    };
  }
}

export async function getCrowdPredictionAI(destination: string, startDate: string, endDate: string) {
  try {
    const response = await fetch("/api/crowd-prediction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination, startDate, endDate }),
    });

    const data = await response.json();

    if (data.success) {
      return data.prediction;
    }

    return {
      level: "🟡 Moderate",
      description: "Tourist season with moderate crowds",
      tips: "Book accommodations in advance",
    };
  } catch (error) {
    console.error("Error fetching crowd prediction:", error);
    return {
      level: "🟡 Moderate",
      description: "Tourist season with moderate crowds",
      tips: "Book accommodations in advance",
    };
  }
}