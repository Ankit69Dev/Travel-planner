import { TripData, Itinerary } from "./types";
import { fetchWeather } from "./api/weather";
import { generateTransportDetails } from "./api/transport";
import { generateRailwayRecommendations } from "./api/railways";
import { generateDailyItinerary } from "./api/itinerary";
import { fetchHotels } from "./api/hotels";

export async function generateCompleteItinerary(tripData: TripData) {
  const start = new Date(tripData.startDate);
  const end = new Date(tripData.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  console.log(`📅 Trip duration: ${days} days from ${tripData.startDate} to ${tripData.endDate}`);

  const weather = await fetchWeather(
    tripData.destination!.name,
    tripData.destination!.lat,
    tripData.destination!.lng,
    tripData.startDate,
    tripData.endDate
  );

  const transportDetails = await generateTransportDetails(tripData);

  // Only generate railway recommendations if transport is Train
  let railways = [];
  if (tripData.transport === "Train") {
    railways = await generateRailwayRecommendations(
      tripData.startLocation!.name,
      tripData.destination!.name,
      tripData.budget
    );
  }

  const dailyPlan = await generateDailyItinerary(tripData, days, start);

  const hotels = await fetchHotels(
    tripData.destination!.name,
    tripData.startDate,
    tripData.endDate,
    tripData.budget
  );

  const itinerary: Itinerary = {
    startLocation: tripData.startLocation!.name,
    destination: tripData.destination!.name,
    dates: `${tripData.startDate} to ${tripData.endDate}`,
    travelers: tripData.travelers,
    budget: tripData.budget,
    transport: {
      mode: tripData.transport,
      ...transportDetails,
    },
    days: dailyPlan,
  };

  return {
    itinerary,
    weather,
    hotels,
    railways,
  };
}