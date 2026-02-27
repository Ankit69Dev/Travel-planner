"use client";

import { useState, useRef, useEffect } from "react";

interface Location {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country: string;
}

interface Props {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  value?: string;
}

export default function LocationSearch({
  onLocationSelect,
  placeholder = "Search destination...",
  value = "",
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = async (text: string) => {
    if (text.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${text}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}&limit=5&type=city&format=json`
    );
    const data = await response.json();

    if (data.results) {
      setResults(data.results);
      setOpen(true);
    }
    setLoading(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => search(val), 300);
  };

  const select = (place: any) => {
    const displayName = place.city || place.name;
    onLocationSelect({
      name: place.city || place.name,
      displayName: place.formatted,
      lat: place.lat,
      lng: place.lon,
      country: place.country,
    });
    setQuery(displayName);
    setOpen(false);
    setResults([]);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    // Notify parent that location was cleared
    onLocationSelect({
      name: "",
      displayName: "",
      lat: 0,
      lng: 0,
      country: "",
    });
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={onChange}
        onFocus={() => {
          if (results.length > 0 && query.length >= 2) {
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 pr-10 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 relative z-10"
      />

      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none z-20"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {query && !loading && (
        <button
          onClick={clearSearch}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white z-20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {open && results.length > 0 && (
        <>
          <div 
            className="fixed inset-0 z-[100]" 
            onClick={() => setOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-[101]">
            {results.map((place, i) => (
              <button
                key={i}
                onClick={() => select(place)}
                className="w-full px-4 py-3 text-left hover:bg-purple-500/20 border-b border-gray-800 last:border-0 transition-colors"
              >
                <p className="text-white font-medium">{place.city || place.name}</p>
                <p className="text-sm text-gray-400">{place.formatted}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}