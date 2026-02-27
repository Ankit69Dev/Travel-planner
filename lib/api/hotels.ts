export async function fetchHotels(
  destination: string,
  checkIn: string,
  checkOut: string,
  budget: string
) {
  const response = await fetch("/api/hotels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination,
      checkIn,
      checkOut,
      budget,
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error("Failed to fetch hotels");
  }

  return data.hotels || [];
}