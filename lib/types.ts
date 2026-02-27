export interface Location {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country: string;
}

export interface TripData {
  startLocation: Location | null;
  destination: Location | null;
  startDate: string;
  endDate: string;
  travelers: "Solo" | "Duo" | "Group";
  budget: "Low" | "Moderate" | "High";
  transport: "Bus" | "Train";
}

export interface Activity {
  time: string;
  activity: string;
  cost: string;
}

export interface Day {
  day: number;
  date: string;
  activities: Activity[];
}

export interface Transport {
  mode: string;
  duration: string;
  cost: string;
  emissions: string;
  departureTime: string;
  arrivalTime: string;
  route: string;
}

export interface Hotel {
  name: string;
  price: string;
  rating: string;
  address: string;
  amenities?: string;
}

export interface Railway {
  trainName: string;
  trainNumber: string;
  class: string;
  price: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
}

export interface Weather {
  current: {
    temp: number;
    feelsLike: number;
    condition: string;
    description: string;
    humidity: number;
    windSpeed: number;
  };
  forecast?: Array<{
    date: string;
    temp: number;
    minTemp: number;
    maxTemp: number;
    condition: string;
    humidity: number;
    description: string;
  }>;
}

export interface Itinerary {
  startLocation: string;
  destination: string;
  dates: string;
  travelers: string;
  budget: string;
  transport: Transport;
  days: Day[];
}