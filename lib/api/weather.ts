import { TripData } from "../types";

export async function fetchWeather(
  destination: string,
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
) {
  // Calculate actual trip days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  const response = await fetch("/api/weather", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination,
      lat,
      lng,
      startDate,
      endDate,
      days: tripDays, // Pass the actual number of days
    }),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error("Failed to fetch weather");
  }

  return data.weather;
}