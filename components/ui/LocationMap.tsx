"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationMapProps {
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startName?: string;
  endName?: string;
}

function MapView({ startLat, startLng, endLat, endLng }: any) {
  const map = useMap();

  useEffect(() => {
    if (startLat && startLng && endLat && endLng) {
      // Fit bounds to show both markers
      const bounds = L.latLngBounds([startLat, startLng], [endLat, endLng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (startLat && startLng) {
      map.setView([startLat, startLng], 10);
    } else if (endLat && endLng) {
      map.setView([endLat, endLng], 10);
    }
  }, [startLat, startLng, endLat, endLng, map]);

  return null;
}

export default function LocationMap({
  startLat,
  startLng,
  endLat,
  endLng,
  startName,
  endName,
}: LocationMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
  const defaultZoom = 5;

  const center: [number, number] =
    startLat && startLng
      ? [startLat, startLng]
      : endLat && endLng
        ? [endLat, endLng]
        : defaultCenter;

  return (
    <div className="w-full h-[830px] rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl">
      <MapContainer
        center={center}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapView
          startLat={startLat}
          startLng={startLng}
          endLat={endLat}
          endLng={endLng}
        />

        {/* Start Marker */}
        {startLat && startLng && (
          <Marker position={[startLat, startLng]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-green-600">Starting Point</p>
                <p className="text-sm">{startName || "Start"}</p>
                <p className="text-xs text-gray-600">
                  {startLat.toFixed(4)}, {startLng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* End Marker */}
        {endLat && endLng && (
          <Marker position={[endLat, endLng]}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-red-600">Destination</p>
                <p className="text-sm">{endName || "End"}</p>
                <p className="text-xs text-gray-600">
                  {endLat.toFixed(4)}, {endLng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {startLat && startLng && endLat && endLng && (
          <Polyline
            positions={[
              [startLat, startLng],
              [endLat, endLng],
            ]}
            pathOptions={{
              color: "#9333ea",
              weight: 4,
              opacity: 0.7,
              dashArray: "10, 10",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
