"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LocationSearch from "@/components/ui/LocationSearch";
import dynamic from "next/dynamic";
import { TripData, Itinerary, Weather, Hotel, Railway } from "@/lib/types";
import { generateCompleteItinerary } from "@/lib/itineraryGenerator";
import { sendChatMessage } from "@/lib/api/chat";
import { generateTripPDF } from "@/utils/pdfGenerator";
import Link from "next/link";
import VoiceAssistant from "@/components/ui/VoiceAssistant";
import {
  getEmergencyContactsAI,
  getCrowdPredictionAI,
} from "@/lib/emergencyContacts";
import Loader from "@/components/ui/loader";
import { generateFoodSuggestions } from "@/lib/api/food";
import { Button } from "@/components/ui/buttonprimary";

const LocationMap = dynamic(() => import("@/components/ui/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-900/50 rounded-xl border border-purple-500/30 flex items-center justify-center">
      <div className="text-purple-400">Loading map...</div>
    </div>
  ),
});

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addingDays, setAddingDays] = useState(false);
  const [extraDays, setExtraDays] = useState(1);
  const [emergencyContacts, setEmergencyContacts] = useState<any>(null);
  const [crowdPrediction, setCrowdPrediction] = useState<any>(null);
  const [loadingEmergency, setLoadingEmergency] = useState(false);
  const [selectedStartLocation, setSelectedStartLocation] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [additionalDestinations, setAdditionalDestinations] = useState<any[]>(
    [],
  );
  const [canAddMore, setCanAddMore] = useState(2);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [tripData, setTripData] = useState<TripData>({
    startLocation: null,
    destination: null,
    startDate: "",
    endDate: "",
    travelers: "Solo",
    budget: "Moderate",
    transport: "Train",
  });

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [railways, setRailways] = useState<Railway[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [generating, setGenerating] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
const [foodSuggestions, setFoodSuggestions] = useState<any[]>([]);
const [loadingFood, setLoadingFood] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "pilgrimage") {
      const storedDestination = sessionStorage.getItem("pilgrimageDestination");
      if (storedDestination) {
        try {
          const destination = JSON.parse(storedDestination);
          setSelectedDestination(destination);
          setTripData((prev) => ({ ...prev, destination }));
          sessionStorage.removeItem("pilgrimageDestination");
        } catch (error) {
          console.error("Error parsing pilgrimage destination:", error);
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);

    try {
      const userLocation = session?.user?.email?.includes("@")
        ? "India"
        : "India";

      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userLocation }),
      });

      const data = await response.json();

      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (itinerary) {
      fetchEmergencyData();
    }
  }, [itinerary]);

  const fetchEmergencyData = async () => {
    if (!itinerary) return;

    setLoadingEmergency(true);

    try {
      const [contacts, crowd] = await Promise.all([
        getEmergencyContactsAI(itinerary.destination),
        getCrowdPredictionAI(
          itinerary.destination,
          tripData.startDate,
          tripData.endDate,
        ),
      ]);

      setEmergencyContacts(contacts);
      setCrowdPrediction(crowd);
    } catch (error) {
      console.error("Error fetching emergency data:", error);
    } finally {
      setLoadingEmergency(false);
    }
  };

  useEffect(() => {
  const mode = searchParams.get("mode");
  if (mode === "explore") {
    const storedDestination = sessionStorage.getItem("Exploration");
    if (storedDestination) {
      try {
        const destination = JSON.parse(storedDestination);
        setSelectedDestination(destination);
        setTripData((prev) => ({ ...prev, destination }));
        sessionStorage.removeItem("Exploration");
      } catch (error) {
        console.error("Error parsing exploration:", error);
      }
    }
  }
}, [searchParams]);

  useEffect(() => {
  if (itinerary) {
    fetchEmergencyAndFoodData();
  }
}, [itinerary]);

const fetchEmergencyAndFoodData = async () => {
  if (!itinerary) return;
  
  setLoadingEmergency(true);
  setLoadingFood(true);
  
  try {
    // Fetch all in parallel
    const [contacts, crowd, food] = await Promise.all([
      getEmergencyContactsAI(itinerary.destination),
      getCrowdPredictionAI(itinerary.destination, tripData.startDate, tripData.endDate),
      generateFoodSuggestions(itinerary.destination, tripData.budget),
    ]);
    
    setEmergencyContacts(contacts);
    setCrowdPrediction(crowd);
    setFoodSuggestions(food);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoadingEmergency(false);
    setLoadingFood(false);
  }
};

  const detectCurrentLocation = async () => {
  setDetectingLocation(true);
  
  try {
    // Request geolocation
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}&format=json`
          );
          
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const place = data.results[0];
            const currentLocation = {
              name: place.city || place.town || place.village || place.county,
              displayName: place.formatted,
              lat: latitude,
              lng: longitude,
              country: place.country,
            };
            
            setSelectedStartLocation(currentLocation);
            setTripData((prev) => ({ ...prev, startLocation: currentLocation }));
            
            alert(`Current location detected: ${currentLocation.name}`);
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          alert("Could not determine location name");
        }
        
        setDetectingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Could not detect location. Please enable location access.");
        setDetectingLocation(false);
      }
    );
  } catch (error) {
    console.error("Location detection error:", error);
    setDetectingLocation(false);
  }
};

  const handleStartLocationSelect = (location: any) => {
    setSelectedStartLocation(location);
    setTripData((prev) => ({ ...prev, startLocation: location }));
  };

  const handleDestinationSelect = (location: any) => {
    setSelectedDestination(location);
    setTripData((prev) => ({ ...prev, destination: location }));
  };

  const handleClearStartLocation = () => {
    setSelectedStartLocation(null);
    setTripData((prev) => ({ ...prev, startLocation: null }));
  };

  const handleClearDestination = () => {
    setSelectedDestination(null);
    setTripData((prev) => ({ ...prev, destination: null }));
  };

  const handleVoiceDataExtracted = async (voiceData: any) => {
    console.log("Voice data extracted:", voiceData);

    setVoiceAssistantOpen(false);

    try {
      if (voiceData.startLocation) {
        const startResponse = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${voiceData.startLocation}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}&limit=1&format=json`,
        );
        const startData = await startResponse.json();
        if (startData.results && startData.results.length > 0) {
          const start = startData.results[0];
          const startLoc = {
            name: start.city || start.name,
            displayName: start.formatted,
            lat: start.lat,
            lng: start.lon,
            country: start.country,
          };
          setSelectedStartLocation(startLoc);
          setTripData((prev) => ({ ...prev, startLocation: startLoc }));
        }
      }

      if (voiceData.destination) {
        const destResponse = await fetch(
          `https://api.geoapify.com/v1/geocode/search?text=${voiceData.destination}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}&limit=1&format=json`,
        );
        const destData = await destResponse.json();
        if (destData.results && destData.results.length > 0) {
          const dest = destData.results[0];
          const destLoc = {
            name: dest.city || dest.name,
            displayName: dest.formatted,
            lat: dest.lat,
            lng: dest.lon,
            country: dest.country,
          };
          setSelectedDestination(destLoc);
          setTripData((prev) => ({ ...prev, destination: destLoc }));
        }
      }

      setTripData((prev) => ({
        ...prev,
        startDate: voiceData.startDate || prev.startDate,
        endDate: voiceData.endDate || prev.endDate,
        travelers: voiceData.travelers || prev.travelers,
        budget: voiceData.budget || prev.budget,
        transport: voiceData.transport || prev.transport,
      }));

      setTimeout(() => {
        if (
          voiceData.startLocation &&
          voiceData.destination &&
          voiceData.startDate &&
          voiceData.endDate
        ) {
          generateItinerary();
        }
      }, 1000);
    } catch (error) {
      console.error("Error processing voice data:", error);
      alert("स्थान खोजने में समस्या हुई। कृपया मैन्युअल रूप से चुनें।");
    }
  };

  const generateItinerary = async () => {
    if (
      !tripData.startLocation ||
      !tripData.destination ||
      !tripData.startDate ||
      !tripData.endDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setGenerating(true);

    try {
      const result = await generateCompleteItinerary(tripData);

      setItinerary(result.itinerary);
      setWeather(result.weather);
      setHotels(result.hotels);
      setRailways(result.railways);
    } catch (error: any) {
      console.error("❌ Error:", error);
      alert(
        `Failed to generate itinerary: ${error.message}\n\nPlease try again.`,
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const aiResponse = await sendChatMessage(chatInput, itinerary, weather);
      const aiMessage = { role: "assistant", content: aiResponse };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!itinerary) return;
    await generateTripPDF(itinerary, weather, hotels, railways);
  };

  const saveTrip = async () => {
    if (!itinerary) return;

    try {
      const response = await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary,
          weather,
          hotels,
          railways,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Trip saved successfully!");
      } else {
        alert("Failed to save trip: " + data.error);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save trip");
    }
  };

  const clearAndRefresh = () => {
    setTripData({
      startLocation: null,
      destination: null,
      startDate: "",
      endDate: "",
      travelers: "Solo",
      budget: "Moderate",
      transport: "Train",
    });
    setSelectedStartLocation(null);
    setSelectedDestination(null);
    setItinerary(null);
    setHotels([]);
    setRailways([]);
    setWeather(null);
    setChatMessages([]);
  };

  if (status === "loading") {
    return (
      <div className="items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-20 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Card */}
        <div className="relative w-full backdrop-blur-md rounded-3xl border border-purple-500/50 px-8 md:px-16 py-12 shadow-xl mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="text-xl md:text-2xl font-medium text-purple-300 text-center">
            Smart Trip Planner Powered by AI
          </p>
        </div>
        {/* AI Voice Assistant Button */}
        <div className="mb-10">
          <button
            onClick={() => setVoiceAssistantOpen(true)}
            className="w-full cursor-pointer bg-gradient-to-r from-purple-900 via-purple-500 to-purple-900  hover:from-purple-900 hover:to-purple-900 transition-all rounded-2xl p-3 shadow-2xl  border-2 border-white/20"
          >
            <div className="flex items-center justify-center gap-6">
              {/* Mic Icon */}
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
              </div>

              {/* Text */}
              <div className="text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  🎤 AI Voice Assistant
                </h3>
                <div className="space-y-1">
                  <p className="text-white/90 text-lg font-medium">
                    <span className="font-bold">Just say it. AI plans it.</span>
                  </p>
                  <p className="text-white/90 text-lg font-medium">
                    <span className="font-bold">
                      बस बोलिए। AI योजना बना देगा।
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>
        {/* Voice Assistant Modal */}
        {voiceAssistantOpen && (
          <VoiceAssistant
            onTripDataExtracted={handleVoiceDataExtracted}
            onClose={() => setVoiceAssistantOpen(false)}
          />
        )}
        {/* Title Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-purple-500">
            Tell Us Your Travel Preferences
          </h1>
          <h3 className="text-xl mt-3 font-semibold text-white">
            Just provide some basic information, and our AI will generate a
            customized itinerary.
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left - Form */}
          <div className="space-y-6">
            {/* Start Location */}
<div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[60]">
  <div className="flex items-center justify-between mb-3">
    <label className="block text-purple-300 font-semibold">
      Starting Point *
    </label>
    <button
      onClick={detectCurrentLocation}
      disabled={detectingLocation}
      className="flex items-center gap-2 cursor-pointer px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
      title="Use current location"
    >
      {detectingLocation ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Detecting...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Current Location</span>
        </>
      )}
    </button>
  </div>
  <LocationSearch
    key={`start-${selectedStartLocation?.name || 'empty'}`}
    onLocationSelect={handleStartLocationSelect}
    placeholder="Where are you starting from?"
    value={selectedStartLocation?.name || ""}
  />
</div>

            {/* Destination */}
            <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[50]">
              <label className="block text-purple-300 font-semibold mb-3">
                Destination *
              </label>
              <LocationSearch
                key={`dest-${selectedDestination?.name || "empty"}`}
                onLocationSelect={handleDestinationSelect}
                placeholder="Where do you want to go?"
                value={selectedDestination?.name || ""}
              />
            </div>

            {/* Additional Destinations */}
            {additionalDestinations.map((dest, index) => (
              <div
                key={index}
                className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[45]"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-purple-300 font-semibold">
                    Additional Destination {index + 1}
                  </label>
                  <button
                    onClick={() => {
                      setAdditionalDestinations(
                        additionalDestinations.filter((_, i) => i !== index),
                      );
                      setCanAddMore(canAddMore + 1);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <LocationSearch
                  key={`additional-${index}-${dest?.name || "empty"}`}
                  onLocationSelect={(location) => {
                    const newDests = [...additionalDestinations];
                    newDests[index] = location;
                    setAdditionalDestinations(newDests);
                  }}
                  placeholder="Add another destination"
                  value={dest?.name || ""}
                />
              </div>
            ))}

            {/* Add Destination Button */}
            {canAddMore > 0 && (
              <button
                onClick={() => {
                  setAdditionalDestinations([...additionalDestinations, null]);
                  setCanAddMore(canAddMore - 1);
                }}
                className="w-full py-3 border-2 border-dashed border-purple-500/50 rounded-xl text-purple-300 hover:border-purple-500 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Destination ({canAddMore} remaining)
              </button>
            )}

            {/* Dates */}
            <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[40]">
              <label className="block text-purple-300 font-semibold mb-3">
                Travel Dates *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripData.startDate}
                    onChange={(e) =>
                      setTripData({ ...tripData, startDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripData.endDate}
                    onChange={(e) =>
                      setTripData({ ...tripData, endDate: e.target.value })
                    }
                    min={
                      tripData.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Travelers */}
            <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[30]">
              <label className="block text-purple-300 font-semibold mb-3">
                Number of Travelers
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["Solo", "Duo", "Group"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      setTripData({ ...tripData, travelers: option })
                    }
                    className={`py-3 rounded-xl cursor-pointer font-medium transition-all ${
                      tripData.travelers === option
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[20]">
              <label className="block text-purple-300 font-semibold mb-3">
                Budget Range
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["Low", "Moderate", "High"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTripData({ ...tripData, budget: option })}
                    className={`py-3 rounded-xl cursor-pointer font-medium transition-all ${
                      tripData.budget === option
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Transport */}
            <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 relative z-[10]">
              <label className="block text-purple-300 font-semibold mb-3">
                Preferred Transport
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["Bus", "Train"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      setTripData({ ...tripData, transport: option })
                    }
                    className={`py-3 rounded-xl cursor-pointer font-medium transition-all ${
                      tripData.transport === option
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateItinerary}
              disabled={generating}
              className="w-full py-4 cursor-pointer bg-gradient-to-r from-purple-800 to-purple-600 text-white font-bold rounded-xl hover:from-purple-900 hover:to-purple-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-[5]"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating with AI...
                </>
              ) : (
                "Generate Itinerary with AI"
              )}
            </button>

            {/* Clear & Refresh Button */}
            <button
              onClick={clearAndRefresh}
              className="w-full py-3 cursor-pointer bg-red-600 text-white font-semibold rounded-xl hover:bg-red-800 transition-all flex items-center justify-center gap-2 relative z-[5]"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Clear & Refresh
            </button>
          </div>

          {/* Right - Map */}
          <div className="relative">
            <div className="w-full backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl top-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Route Map
                </h2>
                {selectedStartLocation && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-400">From:</p>
                    <p className="text-white font-semibold">
                      {selectedStartLocation.name}
                    </p>
                  </div>
                )}
                {selectedDestination && (
                  <div>
                    <p className="text-sm text-gray-400">To:</p>
                    <p className="text-white font-semibold">
                      {selectedDestination.name}
                    </p>
                  </div>
                )}
              </div>

              <LocationMap
                startLat={selectedStartLocation?.lat}
                startLng={selectedStartLocation?.lng}
                endLat={selectedDestination?.lat}
                endLng={selectedDestination?.lng}
                startName={selectedStartLocation?.name}
                endName={selectedDestination?.name}
              />
            </div>
          </div>
        </div>

        {/* Itinerary Display */}
        {itinerary && (
          <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-3xl font-bold text-purple-400">
                Your AI-Generated Itinerary
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={saveTrip}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Save Trip
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>

            {/* Trip Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-purple-500/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">From</p>
                <p className="text-white font-semibold text-lg">
                  {itinerary.startLocation}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">To</p>
                <p className="text-white font-semibold text-lg">
                  {itinerary.destination}
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Dates</p>
                <p className="text-white font-semibold">{itinerary.dates}</p>
              </div>
              <div className="bg-purple-500/10 rounded-xl p-4">
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-white font-semibold">
                  {itinerary.days.length} Days
                </p>
              </div>
            </div>

            {/* Weather Forecast */}
            {weather && (
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                  Weather Forecast
                </h3>

                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-semibold mb-2">
                    Current Weather
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Temperature</p>
                      <p className="text-white text-2xl font-bold">
                        {weather.current.temp}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Feels Like</p>
                      <p className="text-white text-xl font-semibold">
                        {weather.current.feelsLike}°C
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Condition</p>
                      <p className="text-white font-semibold">
                        {weather.current.condition}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Humidity</p>
                      <p className="text-white font-semibold">
                        {weather.current.humidity}%
                      </p>
                    </div>
                  </div>
                </div>

                {weather.forecast && weather.forecast.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-3">
                      Trip Forecast ({weather.forecast.length} Days)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {weather.forecast.map((day: any, idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                          <p className="text-gray-300 text-sm mb-2">
                            {day.date}
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white text-lg font-bold">
                                {day.temp}°C
                              </p>
                              <p className="text-gray-400 text-xs">
                                {day.minTemp}° / {day.maxTemp}°
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-300 text-sm">
                                {day.condition}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {day.humidity}% humidity
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-purple-500/10 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Packing Suggestions
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {weather.current.temp > 30 && (
                      <div className="bg-white/5 rounded px-3 py-2">
                        <span className="text-yellow-400">☀️</span> Sunscreen
                      </div>
                    )}
                    {weather.current.temp < 15 && (
                      <div className="bg-white/5 rounded px-3 py-2">
                        <span className="text-blue-400">🧥</span> Warm jacket
                      </div>
                    )}
                    {weather.current.humidity > 70 && (
                      <div className="bg-white/5 rounded px-3 py-2">
                        <span className="text-cyan-400">☂️</span> Umbrella
                      </div>
                    )}
                    <div className="bg-white/5 rounded px-3 py-2">
                      <span className="text-purple-400">👟</span> Comfortable
                      shoes
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transport Details */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Transport Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Mode</p>
                  <p className="text-white font-semibold">
                    {itinerary.transport.mode}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-semibold">
                    {itinerary.transport.duration}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Cost</p>
                  <p className="text-green-400 font-semibold">
                    {itinerary.transport.cost}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Emissions</p>
                  <p className="text-white font-semibold">
                    {itinerary.transport.emissions}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-purple-500/30">
                <p className="text-gray-300">
                  <span className="font-semibold">Route:</span>{" "}
                  {itinerary.transport.route}
                </p>
                <p className="text-gray-300 mt-1">
                  <span className="font-semibold">Departure:</span>{" "}
                  {itinerary.transport.departureTime} |
                  <span className="font-semibold"> Arrival:</span>{" "}
                  {itinerary.transport.arrivalTime}
                </p>
              </div>
            </div>

            {/* Railway Recommendations */}
            {railways.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  Railway Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {railways.map((train, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-xl p-5 border border-purple-500/30 hover:border-purple-500/60 transition-all"
                    >
                      <div className="mb-3">
                        <h4 className="text-white font-bold text-lg">
                          {train.trainName}
                        </h4>
                        <p className="text-gray-400 text-sm">
                          Train #{train.trainNumber}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Class:</span>
                          <span className="text-white font-semibold">
                            {train.class}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white font-semibold">
                            {train.duration}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Departure:</span>
                          <span className="text-white font-semibold">
                            {train.departureTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Arrival:</span>
                          <span className="text-white font-semibold">
                            {train.arrivalTime}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-purple-500/30">
                        <p className="text-green-400 font-bold text-xl">
                          {train.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotels */}
            {hotels.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Recommended Hotels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {hotels.map((hotel, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 rounded-xl p-5 border border-purple-500/30 hover:border-purple-500/60 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-semibold text-lg">
                          {hotel.name}
                        </h4>
                        <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-lg">
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white text-sm font-semibold">
                            {hotel.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        {hotel.address}
                      </p>
                      <p className="text-green-400 font-bold text-lg">
                        {hotel.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food Suggestions */}
{foodSuggestions.length > 0 && (
  <div className="mb-8">
    <h3 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-2">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      Must-Try Local Food
    </h3>

    {loadingFood ? (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading food suggestions...</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foodSuggestions.map((food, idx) => (
          <div
            key={idx}
            className="bg-white/5 rounded-xl p-5 border border-purple-500/30 hover:border-purple-500/60 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">{food.name}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
                    {food.type}
                  </span>
                  {food.vegetarian && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
                      🥬 Veg
                    </span>
                  )}
                  {food.mustTry && (
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                      ⭐ Must Try
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {food.description}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">💰 Price:</span>
                <span className="text-green-400 font-semibold">{food.priceRange}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400">📍</span>
                <span className="text-purple-300 text-xs">{food.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

            {/* Crowd Predictor & Emergency Contacts - AI POWERED */}
            {loadingEmergency ? (
              <div className="bg-white/5 rounded-xl p-8 mb-8 text-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">
                  Loading emergency info and crowd predictions...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Crowd Predictor - AI POWERED */}
                {crowdPrediction && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/30">
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      AI Crowd Prediction
                    </h3>

                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <p className="text-2xl font-bold text-white mb-2">
                        {crowdPrediction.level}
                      </p>
                      <p className="text-gray-300 text-sm mb-3">
                        {crowdPrediction.description}
                      </p>

                      {crowdPrediction.festivals &&
                        crowdPrediction.festivals.length > 0 && (
                          <div className="mt-3 bg-orange-500/20 rounded-lg p-3">
                            <p className="text-orange-300 font-semibold text-sm mb-2">
                              🎉 Festivals/Events:
                            </p>
                            <ul className="text-white text-sm space-y-1">
                              {crowdPrediction.festivals.map(
                                (festival: string, idx: number) => (
                                  <li key={idx}>• {festival}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>

                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">
                        💡 Travel Tip:
                      </p>
                      <p className="text-white text-sm">
                        {crowdPrediction.tips}
                      </p>
                    </div>

                    {crowdPrediction.bestTimeToVisit && (
                      <div className="mt-3 bg-white/5 rounded-lg p-3">
                        <p className="text-gray-400 text-xs mb-1">
                          ⏰ Best Time to Visit:
                        </p>
                        <p className="text-white text-sm">
                          {crowdPrediction.bestTimeToVisit}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Emergency Contacts - AI POWERED */}
                {emergencyContacts && (
                  <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl p-6 border border-red-500/30">
                    <h3 className="text-xl font-bold text-red-300 mb-4 flex items-center gap-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      AI-Generated Emergency Contacts
                    </h3>

                    <div className="space-y-3">
                      {emergencyContacts.police && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            🚨 Police
                          </span>
                          <a
                            href={`tel:${emergencyContacts.police}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.police}
                          </a>
                        </div>
                      )}

                      {emergencyContacts.ambulance && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            🚑 Ambulance
                          </span>
                          <a
                            href={`tel:${emergencyContacts.ambulance}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.ambulance}
                          </a>
                        </div>
                      )}

                      {emergencyContacts.fire && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            🚒 Fire
                          </span>
                          <a
                            href={`tel:${emergencyContacts.fire}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.fire}
                          </a>
                        </div>
                      )}

                      {emergencyContacts.tourist && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            ℹ️ Tourist Helpline
                          </span>
                          <a
                            href={`tel:${emergencyContacts.tourist}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.tourist}
                          </a>
                        </div>
                      )}

                      {emergencyContacts.localPolice && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            🏛️ Local Police
                          </span>
                          <a
                            href={`tel:${emergencyContacts.localPolice}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.localPolice}
                          </a>
                        </div>
                      )}

                      {emergencyContacts.hospital && (
                        <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                          <span className="text-gray-300 flex items-center gap-2">
                            🏥 Hospital
                          </span>
                          <a
                            href={`tel:${emergencyContacts.hospital}`}
                            className="text-white font-bold hover:text-red-300 transition-colors"
                          >
                            {emergencyContacts.hospital}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 bg-red-500/20 rounded-lg p-3">
                      <p className="text-red-200 text-xs">
                        ⚠️ Save these numbers before your trip. In case of
                        emergency, dial immediately.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Daily Itinerary */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Daily Plan ({itinerary.days.length} Days)
              </h3>
              {itinerary.days.map((day: any) => (
                <div
                  key={day.day}
                  className="bg-white/5 rounded-xl p-6 border border-purple-500/30"
                >
                  <h4 className="text-xl font-bold text-white mb-4">
                    Day {day.day} - {day.date}
                  </h4>
                  <div className="space-y-3">
                    {day.activities &&
                      day.activities.map((activity: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-4 p-3 bg-purple-500/5 rounded-lg hover:bg-purple-500/10 transition-all"
                        >
                          <div className="text-purple-400 font-semibold min-w-[80px]">
                            {activity.time}
                          </div>
                          <div className="flex-1">
                            <p className="text-white">{activity.activity}</p>
                          </div>
                          <div className="text-green-400 font-semibold">
                            {activity.cost}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              {/* Add Extra Days - NEW */}
              <div className="mt-8 bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
                <h4 className="text-white font-bold text-lg mb-4">
                  Want to extend your trip?
                </h4>

                {!addingDays ? (
                  <button
                    onClick={() => setAddingDays(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add More Days
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-white">
                        Number of extra days:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={extraDays}
                        onChange={(e) =>
                          setExtraDays(parseInt(e.target.value) || 1)
                        }
                        className="w-20 px-4 py-2 bg-white/10 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          // Generate extra days
                          const lastDay =
                            itinerary.days[itinerary.days.length - 1];
                          const lastDate = new Date(lastDay.date);

                          const newDays = [];
                          for (let i = 1; i <= extraDays; i++) {
                            const newDate = new Date(lastDate);
                            newDate.setDate(newDate.getDate() + i);

                            newDays.push({
                              day: itinerary.days.length + i,
                              date: newDate.toLocaleDateString(),
                              activities: [
                                {
                                  time: "09:00 AM",
                                  activity: `Explore more of ${itinerary.destination}`,
                                  cost: "₹500",
                                },
                                {
                                  time: "12:00 PM",
                                  activity: "Lunch at local restaurant",
                                  cost: "₹400",
                                },
                                {
                                  time: "03:00 PM",
                                  activity: "Visit nearby attractions",
                                  cost: "₹300",
                                },
                                {
                                  time: "07:00 PM",
                                  activity: "Dinner and relaxation",
                                  cost: "₹600",
                                },
                              ],
                            });
                          }

                          setItinerary({
                            ...itinerary,
                            days: [...itinerary.days, ...newDays],
                          });

                          setAddingDays(false);
                          alert(`${extraDays} day(s) added successfully!`);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setAddingDays(false)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>

        {/* Chat Window */}
        {chatOpen && (
          <div className="fixed bottom-28 right-8 w-96 h-[500px] bg-gray-900 rounded-2xl shadow-2xl border border-purple-500/50 flex flex-col z-50">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-white font-bold">AI Travel Assistant</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <p>Ask me anything about your trip!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-3 rounded-xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSendChatMessage()
                  }
                  placeholder="Ask about your trip..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
