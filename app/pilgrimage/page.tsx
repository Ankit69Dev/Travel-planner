"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { pilgrimagePlaces, getAllReligions, getPilgrimagesByReligion } from "@/lib/pilgrimageData";
import Loader from "@/components/ui/loader";

export default function Pilgrimage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedReligion, setSelectedReligion] = useState<string>("All");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const religions = ["All", ...getAllReligions()];

  const filteredPlaces =
    selectedReligion === "All"
      ? pilgrimagePlaces
      : getPilgrimagesByReligion(selectedReligion);

  const planTrip = (place: any) => {

  sessionStorage.setItem("pilgrimageDestination", JSON.stringify({
    name: place.location.split(",")[0].trim(), 
    displayName: place.location,
    lat: place.lat,
    lng: place.lng,
    country: "India",
  }));
  
  
  router.push("/dashboard?mode=pilgrimage");
};

  if (status === "loading") {
    return (
      <div>
        <Loader/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-20 pt-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
             Sacred Pilgrimage Places
          </h1>
          <p className="text-xl text-purple-300">
            Explore holy destinations and plan your spiritual journey
          </p>
        </div>

        {/* Religion Filter */}
        <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">Filter by Religion</h3>
          <div className="flex flex-wrap gap-3">
            {religions.map((religion) => (
              <button
                key={religion}
                onClick={() => setSelectedReligion(religion)}
                className={`px-6 py-2 cursor-pointer rounded-xl font-medium transition-all ${
                  selectedReligion === religion
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {religion}
              </button>
            ))}
          </div>
        </div>

        {/* Pilgrimage Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className="backdrop-blur-md rounded-2xl border border-purple-500/50 overflow-hidden hover:border-purple-500 transition-all group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {place.religion}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{place.name}</h3>
                <p className="text-purple-300 text-sm mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {place.location}
                </p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {place.description}
                </p>

                {/* Significance */}
                <div className="bg-purple-500/10 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Significance</p>
                  <p className="text-white text-sm">{place.significance}</p>
                </div>

                {/* Best Time */}
                <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Best: {place.bestTimeToVisit}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => planTrip(place)}
                    className="flex-1 cursor-pointer py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Plan Trip
                  </button>
                  <button
                    onClick={() => setSelectedPlace(place)}
                    className="px-4 cursor-pointer py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Details Modal */}
        {selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedPlace(null)}
            />

            <div className="relative z-10 w-full max-w-2xl bg-gray-900 rounded-2xl border border-purple-500/50 overflow-hidden">
              <img
                src={selectedPlace.image}
                alt={selectedPlace.name}
                className="w-full h-64 object-cover"
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedPlace.name}
                    </h2>
                    <p className="text-purple-300">{selectedPlace.location}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Description</h3>
                    <p className="text-gray-300">{selectedPlace.description}</p>
                  </div>

                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Significance</h3>
                    <p className="text-gray-300">{selectedPlace.significance}</p>
                  </div>

                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Best Time to Visit</h3>
                    <p className="text-gray-300">{selectedPlace.bestTimeToVisit}</p>
                  </div>

                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Religion</h3>
                    <span className="inline-block bg-purple-600 text-white px-4 py-1 rounded-full">
                      {selectedPlace.religion}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlace(null);
                    planTrip(selectedPlace);
                  }}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  Plan Trip to {selectedPlace.name}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}