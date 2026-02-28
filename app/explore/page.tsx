"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Loader from "@/components/ui/loader";

const travelPlaces = [
  // Adventure
  {
    id: 1,
    name: "Rishikesh",
    location: "Uttarakhand, India",
    category: "Adventure",
    image: "/rishi.jpeg",
    description: "The adventure capital of India, famous for white-water rafting on the Ganges and bungee jumping.",
    highlight: "White-water Rafting & Bungee Jumping",
    bestTimeToVisit: "September – June",
    lat: 30.0869,
    lng: 78.2676,
  },
  {
    id: 2,
    name: "Zanskar Valley",
    location: "Ladakh, India",
    category: "Adventure",
    image: "/zanskar.jpeg",
    description: "Remote high-altitude valley perfect for trekking, frozen river walks (Chadar Trek), and camping.",
    highlight: "Chadar Trek & High-Altitude Camping",
    bestTimeToVisit: "June – September",
    lat: 33.5,
    lng: 76.9,
  },
  {
    id: 3,
    name: "Bir Billing",
    location: "Himachal Pradesh, India",
    category: "Adventure",
    image: "/bir billing.jpeg",
    description: "World's second highest paragliding site with stunning Himalayan views and trekking trails.",
    highlight: "Paragliding & Trekking",
    bestTimeToVisit: "March – June, Sep – Nov",
    lat: 32.0398,
    lng: 76.7163,
  },
  // Beach & Island
  {
    id: 4,
    name: "Andaman Islands",
    location: "Andaman & Nicobar, India",
    category: "Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    description: "Crystal-clear turquoise waters, pristine white sand beaches, and vibrant coral reefs.",
    highlight: "Scuba Diving & Island Hopping",
    bestTimeToVisit: "October – May",
    lat: 11.7401,
    lng: 92.6586,
  },
  {
    id: 5,
    name: "Goa",
    location: "Goa, India",
    category: "Beach",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80",
    description: "India's beach paradise with golden shores, vibrant nightlife, and Portuguese heritage.",
    highlight: "Beach Parties & Water Sports",
    bestTimeToVisit: "November – February",
    lat: 15.2993,
    lng: 74.124,
  },
  {
    id: 6,
    name: "Lakshadweep",
    location: "Lakshadweep, India",
    category: "Beach",
    image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80",
    description: "Remote coral islands with lagoons of unmatched clarity, perfect for snorkeling and kayaking.",
    highlight: "Snorkeling & Lagoon Kayaking",
    bestTimeToVisit: "October – May",
    lat: 10.5667,
    lng: 72.6417,
  },
  // Cultural & Heritage
  {
    id: 7,
    name: "Hampi",
    location: "Karnataka, India",
    category: "Cultural",
    image: "/hampi.jpeg",
    description: "UNESCO World Heritage Site with stunning ruins of the Vijayanagara Empire spread across boulder-strewn landscapes.",
    highlight: "Vijayanagara Ruins & Temples",
    bestTimeToVisit: "October – February",
    lat: 15.335,
    lng: 76.462,
  },
  {
    id: 8,
    name: "Varanasi",
    location: "Uttar Pradesh, India",
    category: "Cultural",
    image: "/varanasi.jpg",
    description: "One of the world's oldest living cities, where ancient rituals, ghats, and culture converge on the Ganges.",
    highlight: "Ganga Aarti & Heritage Ghats",
    bestTimeToVisit: "October – March",
    lat: 25.3176,
    lng: 82.9739,
  },
  {
    id: 9,
    name: "Jaipur",
    location: "Rajasthan, India",
    category: "Cultural",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=80",
    description: "The Pink City, home to magnificent forts, palaces, and bazaars that echo Rajput grandeur.",
    highlight: "Amber Fort & Hawa Mahal",
    bestTimeToVisit: "November – February",
    lat: 26.9124,
    lng: 75.7873,
  },
  // Nature & Wildlife
  {
    id: 10,
    name: "Jim Corbett National Park",
    location: "Uttarakhand, India",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1549366021-9f761d450615?w=600&q=80",
    description: "India's oldest national park, home to Bengal tigers, elephants, and rich biodiversity in the Himalayan foothills.",
    highlight: "Tiger Safari & Jeep Rides",
    bestTimeToVisit: "November – June",
    lat: 29.5279,
    lng: 79.0479,
  },
  {
    id: 11,
    name: "Kaziranga National Park",
    location: "Assam, India",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=600&q=80",
    description: "UNESCO site hosting the world's largest population of Indian one-horned rhinoceroses.",
    highlight: "Rhino Safari & Elephant Rides",
    bestTimeToVisit: "November – April",
    lat: 26.5775,
    lng: 93.1711,
  },
  {
    id: 12,
    name: "Valley of Flowers",
    location: "Uttarakhand, India",
    category: "Nature",
    image: "/flower.jpeg",
    description: "A UNESCO World Heritage Site blanketed with rare Himalayan wildflowers during the monsoon season.",
    highlight: "Alpine Trekking & Photography",
    bestTimeToVisit: "July – September",
    lat: 30.7283,
    lng: 79.6058,
  },
  // Luxury
  {
    id: 13,
    name: "Udaipur",
    location: "Rajasthan, India",
    category: "Luxury",
    image: "/Udaipur Itinerary for 2 days.jpeg",
    description: "The City of Lakes with opulent palace hotels, boat rides on Lake Pichola, and regal dining experiences.",
    highlight: "Lake Palace Hotel & Royal Dining",
    bestTimeToVisit: "September – March",
    lat: 24.5854,
    lng: 73.7125,
  },
  {
    id: 14,
    name: "Kerala Backwaters",
    location: "Kerala, India",
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80",
    description: "Cruise through serene backwaters on a private houseboat with world-class Ayurvedic spa treatments.",
    highlight: "Luxury Houseboat & Ayurveda Spa",
    bestTimeToVisit: "September – March",
    lat: 9.4981,
    lng: 76.3388,
  },
  {
    id: 15,
    name: "Coorg",
    location: "Karnataka, India",
    category: "Luxury",
    image: "/coorg.jpeg",
    description: "Scotland of India — misty coffee estates, luxury plantation resorts, and wellness retreats.",
    highlight: "Coffee Estate Stays & Spa Retreats",
    bestTimeToVisit: "October – March",
    lat: 12.3375,
    lng: 75.8069,
  },
  // Budget / Backpacking
  {
    id: 16,
    name: "McLeod Ganj",
    location: "Himachal Pradesh, India",
    category: "Budget",
    image: "/mcleodganj.jpeg",
    description: "Home of the Dalai Lama, with budget cafes, trekking trails, and vibrant Tibetan culture.",
    highlight: "Trekking & Tibetan Culture",
    bestTimeToVisit: "March – June, Sep – Nov",
    lat: 32.2396,
    lng: 76.3219,
  },
  {
    id: 17,
    name: "Pushkar",
    location: "Rajasthan, India",
    category: "Budget",
    image: "/pushkar.jpeg",
    description: "A sacred lake town with cheap guesthouses, vibrant bazaars, and the famous Pushkar Camel Fair.",
    highlight: "Camel Fair & Budget Stays",
    bestTimeToVisit: "October – March",
    lat: 26.4899,
    lng: 74.5511,
  },
  {
    id: 18,
    name: "Varkala",
    location: "Kerala, India",
    category: "Budget",
    image: "/varkala.jpeg",
    description: "Clifftop beach town with budget guesthouses, yoga retreats, and beautiful sunset views.",
    highlight: "Cliffside Views & Yoga",
    bestTimeToVisit: "September – March",
    lat: 8.7379,
    lng: 76.7163,
  },
  // Honeymoon / Romantic
  {
    id: 19,
    name: "Munnar",
    location: "Kerala, India",
    category: "Romantic",
    image: "/Munnar - Sunrise.jpeg",
    description: "Rolling tea gardens, misty hills, and cozy couple retreats make Munnar a dreamy romantic getaway.",
    highlight: "Tea Garden Walks & Misty Sunsets",
    bestTimeToVisit: "September – March",
    lat: 10.0889,
    lng: 77.0595,
  },
  {
    id: 20,
    name: "Shimla",
    location: "Himachal Pradesh, India",
    category: "Romantic",
    image: "/shimla.jpeg",
    description: "The Queen of Hills with colonial charm, snow-dusted winters, and intimate heritage hotels.",
    highlight: "Snow Views & Heritage Hotels",
    bestTimeToVisit: "December – February",
    lat: 31.1048,
    lng: 77.1734,
  },
  {
    id: 21,
    name: "Alleppey",
    location: "Kerala, India",
    category: "Romantic",
    image: "/alleppey.jpeg",
    description: "Float through enchanting backwaters on a private houseboat with candlelit dinners under the stars.",
    highlight: "Private Houseboat & Candlelit Dinners",
    bestTimeToVisit: "November – February",
    lat: 9.4981,
    lng: 76.3388,
  },
  // Family
  {
    id: 22,
    name: "Ooty",
    location: "Tamil Nadu, India",
    category: "Family",
    image: "/ooty.jpeg",
    description: "Queen of Hill Stations with a toy train, botanical gardens, and activities loved by all ages.",
    highlight: "Toy Train & Botanical Gardens",
    bestTimeToVisit: "April – June",
    lat: 11.4102,
    lng: 76.695,
  },
  {
    id: 23,
    name: "Mysuru",
    location: "Karnataka, India",
    category: "Family",
    image: "/Mysore Palace_.jpeg",
    description: "Home to the grand Mysore Palace, a famous zoo, and Dasara festivities perfect for families.",
    highlight: "Mysore Palace & Zoo",
    bestTimeToVisit: "October – February",
    lat: 12.2958,
    lng: 76.6394,
  },
  {
    id: 24,
    name: "Nainital",
    location: "Uttarakhand, India",
    category: "Family",
    image: "/nainital.jpeg",
    description: "A charming lake town in the Kumaon Himalayas with boating, cable cars, and family-friendly fun.",
    highlight: "Naini Lake Boating & Cable Car",
    bestTimeToVisit: "March – June",
    lat: 29.3919,
    lng: 79.4542,
  },
  // City Breaks
  {
    id: 25,
    name: "Mumbai",
    location: "Maharashtra, India",
    category: "City",
    image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=80",
    description: "India's city of dreams — Bollywood, street food, sea-facing promenades, and legendary nightlife.",
    highlight: "Marine Drive & Street Food",
    bestTimeToVisit: "November – February",
    lat: 19.076,
    lng: 72.8777,
  },
  {
    id: 26,
    name: "Bengaluru",
    location: "Karnataka, India",
    category: "City",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80",
    description: "India's Silicon Valley with a thriving cafe culture, lush parks, and buzzing nightlife scene.",
    highlight: "Cafe Culture & Craft Beer",
    bestTimeToVisit: "Year-round",
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 27,
    name: "Delhi",
    location: "Delhi, India",
    category: "City",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80",
    description: "India's capital blending Mughal heritage, modern art, street food paradise, and vibrant markets.",
    highlight: "Old Delhi Food Walk & Red Fort",
    bestTimeToVisit: "October – March",
    lat: 28.6139,
    lng: 77.209,
  },
  // Spiritual
  {
    id: 28,
    name: "Bodh Gaya",
    location: "Bihar, India",
    category: "Spiritual",
    image: "/bodh.jpg",
    description: "The holiest site in Buddhism, where Siddhartha Gautama attained enlightenment under the Bodhi Tree.",
    highlight: "Mahabodhi Temple & Meditation",
    bestTimeToVisit: "October – March",
    lat: 24.6962,
    lng: 84.9915,
  },
  {
    id: 29,
    name: "Tirupati",
    location: "Andhra Pradesh, India",
    category: "Spiritual",
    image: "/tirupati.jpg",
    description: "One of the most visited pilgrimage sites in the world, home to the sacred Venkateswara Temple.",
    highlight: "Venkateswara Temple Darshan",
    bestTimeToVisit: "September – February",
    lat: 13.6288,
    lng: 79.4192,
  },
  {
    id: 30,
    name: "Amritsar",
    location: "Punjab, India",
    category: "Spiritual",
    image: "/amritsar.jpeg",
    description: "Home of the iconic Golden Temple, the holiest Sikh shrine, radiating peace and golden splendor.",
    highlight: "Golden Temple & Langar",
    bestTimeToVisit: "October – March",
    lat: 31.634,
    lng: 74.8723,
  },
  // Food & Culinary
  {
    id: 31,
    name: "Kolkata",
    location: "West Bengal, India",
    category: "Food",
    image: "/kolkata.jpeg",
    description: "India's food capital, famous for street food culture — kathi rolls, mishti doi, and macher jhol.",
    highlight: "Street Food Tours & Sweets",
    bestTimeToVisit: "October – February",
    lat: 22.5726,
    lng: 88.3639,
  },
  {
    id: 32,
    name: "Hyderabad",
    location: "Telangana, India",
    category: "Food",
    image: "/hyderabad.jpeg",
    description: "City of the legendary Hyderabadi biryani, irani chai, and rich Nizami culinary heritage.",
    highlight: "Biryani Trail & Irani Cafes",
    bestTimeToVisit: "October – February",
    lat: 17.385,
    lng: 78.4867,
  },
  {
    id: 33,
    name: "Kochi",
    location: "Kerala, India",
    category: "Food",
    image: "/kochi.jpeg",
    description: "A port city where spice trade history meets fresh seafood, Kerala sadya, and fusion cuisine.",
    highlight: "Seafood & Spice Market Tours",
    bestTimeToVisit: "October – March",
    lat: 9.9312,
    lng: 76.2673,
  },
  // Eco / Sustainable
  {
    id: 34,
    name: "Coorg",
    location: "Karnataka, India",
    category: "Eco",
    image: "/coorg.jpeg",
    description: "Lush coffee and spice plantations with eco-lodges, forest walks, and sustainable farm stays.",
    highlight: "Coffee Plantation Stay & Forest Trails",
    bestTimeToVisit: "October – March",
    lat: 12.3375,
    lng: 75.8069,
  },
  {
    id: 35,
    name: "Spiti Valley",
    location: "Himachal Pradesh, India",
    category: "Eco",
    image: "/spiti valley.jpeg",
    description: "A cold desert mountain valley with homestays, solar-powered villages, and pristine Himalayan ecology.",
    highlight: "Eco Homestays & Himalayan Villages",
    bestTimeToVisit: "June – October",
    lat: 32.2473,
    lng: 78.0357,
  },
  {
    id: 36,
    name: "Wayanad",
    location: "Kerala, India",
    category: "Eco",
    image: "/wayanad.jpeg",
    description: "Mist-covered hills, tribal villages, waterfalls, and wildlife sanctuaries with sustainable stays.",
    highlight: "Tribal Village Tours & Wildlife",
    bestTimeToVisit: "September – May",
    lat: 11.6854,
    lng: 76.132,
  },
];

const categories = [
  { label: "All" },
  { label: "Adventure" },
  { label: "Beach"},
  { label: "Cultural"},
  { label: "Nature"},
  { label: "Luxury"},
  { label: "Budget" },
  { label: "Romantic" },
  { label: "Family"},
  { label: "City"},
  { label: "Spiritual" },
  { label: "Food"},
  { label: "Eco" },
];

export default function TravelExplore() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const filteredPlaces =
    selectedCategory === "All"
      ? travelPlaces
      : travelPlaces.filter((p) => p.category === selectedCategory);

  const planTrip = (place: any) => {
    sessionStorage.setItem(
      "travelDestination",
      JSON.stringify({
        name: place.location.split(",")[0].trim(),
        displayName: place.location,
        lat: place.lat,
        lng: place.lng,
        country: "India",
        category: place.category,
      })
    );
    router.push("/dashboard?mode=travel");
  };

  if (status === "loading") {
    return (
      <div>
        <Loader />
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
            Explore Destinations
          </h1>
          <p className="text-xl text-purple-300">
            Discover places by travel style and plan your perfect journey
          </p>
        </div>

        {/* Category Filter */}
        <div className="backdrop-blur-md rounded-2xl border border-purple-500/50 p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">Filter by Travel Style</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-6 py-2 cursor-pointer rounded-xl font-medium transition-all ${
                  selectedCategory === cat.label
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                 {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Place Cards Grid */}
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
                  
                  {place.category}
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

                {/* Highlight */}
                <div className="bg-purple-500/10 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-400 mb-1">Highlight</p>
                  <p className="text-white text-sm">{place.highlight}</p>
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
                    className="flex-1 cursor-pointer py-3 bg-gradient-to-r from-purple-800 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-900 hover:to-purple-900 transition-all"
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
                    <h3 className="text-purple-300 font-semibold mb-2">Highlight</h3>
                    <p className="text-gray-300">{selectedPlace.highlight}</p>
                  </div>
                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Best Time to Visit</h3>
                    <p className="text-gray-300">{selectedPlace.bestTimeToVisit}</p>
                  </div>
                  <div>
                    <h3 className="text-purple-300 font-semibold mb-2">Travel Style</h3>
                    <span className="inline-block bg-purple-600 text-white px-4 py-1 rounded-full">
                      {selectedPlace.category}
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