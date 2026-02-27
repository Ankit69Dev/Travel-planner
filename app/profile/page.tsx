"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTrips();
    }
  }, [session]);

  const fetchTrips = async () => {
    try {
      const response = await fetch("/api/trips");
      const data = await response.json();

      if (data.success) {
        setTrips(data.trips);
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) {
      return;
    }

    setDeleting(tripId);

    try {
      const response = await fetch(`/api/trips/delete?id=${tripId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Remove trip from state
        setTrips(trips.filter((trip) => trip.id !== tripId));
        
        // Close modal if the deleted trip is currently open
        if (selectedTrip?.id === tripId) {
          closeTripModal();
        }
        
        alert("Trip deleted successfully!");
      } else {
        alert("Failed to delete trip: " + data.error);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete trip");
    } finally {
      setDeleting(null);
    }
  };

  const openTripModal = (trip: any) => {
    setSelectedTrip(trip);
    setModalOpen(true);
  };

  const closeTripModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedTrip(null), 300);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-purple-600 text-4xl">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-20 pt-32">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Profile Card */}
        <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl mb-8">
          <div className="flex items-center gap-6">
            <img
              src={session?.user?.image || "/default-avatar.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-purple-500"
            />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {session?.user?.name}
              </h1>
              <p className="text-gray-400">{session?.user?.email}</p>
              <div className="mt-4">
                <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg">
                  {trips.length} Trips Saved
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trip History */}
        <div className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Trip History</h2>

          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading trips...</div>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No trips saved yet</p>
              <Link
                href="/dashboard"
                className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all"
              >
                Plan Your First Trip
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white/5 rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all relative"
                >
                  {/* Delete Button - Top Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrip(trip.id);
                    }}
                    disabled={deleting === trip.id}
                    className="absolute top-5 right-4 p-2 cursor-pointer bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete trip"
                  >
                    {deleting === trip.id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>

                  <div className="flex items-start justify-between mb-4 pr-8">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {trip.destination}
                      </h3>
                      <p className="text-sm text-gray-400">
                        From {trip.startLocation}
                      </p>
                    </div>
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm">
                      {trip.transport}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {trip.startDate} to {trip.endDate}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {trip.travelers}
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {trip.budget} Budget
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Saved on {new Date(trip.createdAt).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() => openTripModal(trip)}
                    className="cursor-pointer w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trip Details Modal */}
      {modalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeTripModal}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-purple-500/50 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedTrip.destination}
                </h2>
                <p className="text-purple-100">
                  From {selectedTrip.startLocation}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Delete Button in Modal */}
                <button
                  onClick={() => deleteTrip(selectedTrip.id)}
                  disabled={deleting === selectedTrip.id}
                  className="p-2 bg-red-500/20 cursor-pointer hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete trip"
                >
                  {deleting === selectedTrip.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={closeTripModal}
                  className="cursor-pointer p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/10 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Dates</p>
                  <p className="text-white font-semibold">
                    {selectedTrip.startDate} to {selectedTrip.endDate}
                  </p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Travelers</p>
                  <p className="text-white font-semibold">{selectedTrip.travelers}</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Budget</p>
                  <p className="text-white font-semibold">{selectedTrip.budget}</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Transport</p>
                  <p className="text-white font-semibold">{selectedTrip.transport}</p>
                </div>
              </div>

              {/* Transport Details */}
              {selectedTrip.itinerary?.transport && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Transport Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Duration</p>
                      <p className="text-white font-semibold">{selectedTrip.itinerary.transport.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Cost</p>
                      <p className="text-green-400 font-semibold">{selectedTrip.itinerary.transport.cost}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Departure</p>
                      <p className="text-white font-semibold">{selectedTrip.itinerary.transport.departureTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Arrival</p>
                      <p className="text-white font-semibold">{selectedTrip.itinerary.transport.arrivalTime}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hotels */}
              {selectedTrip.hotels && selectedTrip.hotels.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Hotels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTrip.hotels.map((hotel: any, idx: number) => (
                      <div key={idx} className="bg-purple-500/10 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">{hotel.name}</h4>
                        <p className="text-green-400 font-bold mb-1">{hotel.price}</p>
                        <p className="text-gray-400 text-sm">{hotel.address}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white text-sm">{hotel.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Railway Options */}
              {selectedTrip.railways && selectedTrip.railways.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-purple-500/30">
                  <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Railway Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTrip.railways.map((train: any, idx: number) => (
                      <div key={idx} className="bg-purple-500/10 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-1">{train.trainName}</h4>
                        <p className="text-gray-400 text-sm mb-3">#{train.trainNumber}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Class:</span>
                            <span className="text-white">{train.class}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white">{train.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Price:</span>
                            <span className="text-green-400 font-semibold">{train.price}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Itinerary */}
              {selectedTrip.itinerary?.days && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Daily Itinerary ({selectedTrip.itinerary.days.length} Days)
                  </h3>
                  {selectedTrip.itinerary.days.map((day: any) => (
                    <div key={day.day} className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
                      <h4 className="text-lg font-bold text-white mb-3">
                        Day {day.day} - {day.date}
                      </h4>
                      <div className="space-y-2">
                        {day.activities.map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-2 bg-purple-500/5 rounded-lg text-sm">
                            <span className="text-purple-400 font-semibold min-w-[70px]">
                              {activity.time}
                            </span>
                            <span className="flex-1 text-white">{activity.activity}</span>
                            <span className="text-green-400 font-semibold">{activity.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-purple-500/30 p-4 rounded-b-2xl">
              <button
                onClick={closeTripModal}
                className="cursor-pointer w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}