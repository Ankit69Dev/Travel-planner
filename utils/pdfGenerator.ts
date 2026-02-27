import { jsPDF } from "jspdf";

interface Activity {
  time: string;
  activity: string;
  cost: string;
}

interface Day {
  day: number;
  date: string;
  activities: Activity[];
}

interface Transport {
  mode: string;
  duration: string;
  cost: string;
  emissions: string;
  departureTime: string;
  arrivalTime: string;
  route: string;
}

interface Hotel {
  name: string;
  price: string;
  rating: string;
  address: string;
}

interface Railway {
  trainName: string;
  trainNumber: string;
  class: string;
  price: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
}

interface Weather {
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast?: Array<{
    date: string;
    temp: number;
    minTemp: number;
    maxTemp: number;
    condition: string;
  }>;
}

interface Itinerary {
  startLocation: string;
  destination: string;
  dates: string;
  travelers: string;
  budget: string;
  transport: Transport;
  days: Day[];
}

export async function generateTripPDF(
  itinerary: Itinerary,
  weather: Weather | null,
  hotels: Hotel[],
  railways: Railway[]
) {
  const doc = new jsPDF();
  let y = 20;

  // Helper function to check if we need a new page
  const checkPageBreak = (spaceNeeded: number = 20) => {
    if (y > 270 - spaceNeeded) {
      doc.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(22);
  doc.setTextColor(147, 51, 234);
  doc.text("Trip Itinerary", 105, y, { align: "center" });
  y += 15;

  // Trip Overview Section
  doc.setFontSize(16);
  doc.setTextColor(147, 51, 234);
  doc.text("Trip Overview", 20, y);
  y += 10;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`From: ${itinerary.startLocation}`, 25, y);
  y += 7;
  doc.text(`To: ${itinerary.destination}`, 25, y);
  y += 7;
  doc.text(`Dates: ${itinerary.dates}`, 25, y);
  y += 7;
  doc.text(`Duration: ${itinerary.days.length} Days`, 25, y);
  y += 7;
  doc.text(`Travelers: ${itinerary.travelers}`, 25, y);
  y += 7;
  doc.text(`Budget: ${itinerary.budget}`, 25, y);
  y += 15;

  // Transport Section
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setTextColor(147, 51, 234);
  doc.text("Transport Details", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Mode: ${itinerary.transport.mode}`, 25, y);
  y += 6;
  doc.text(`Route: ${itinerary.transport.route}`, 25, y);
  y += 6;
  doc.text(`Duration: ${itinerary.transport.duration}`, 25, y);
  y += 6;
  doc.text(`Cost: ${itinerary.transport.cost}`, 25, y);
  y += 6;
  doc.text(`Emissions: ${itinerary.transport.emissions}`, 25, y);
  y += 6;
  doc.text(
    `Schedule: Departure ${itinerary.transport.departureTime} | Arrival ${itinerary.transport.arrivalTime}`,
    25,
    y
  );
  y += 15;

  // Weather Section
  if (weather) {
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setTextColor(147, 51, 234);
    doc.text("Weather Forecast", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Current: ${weather.current.temp}°C, ${weather.current.condition}`,
      25,
      y
    );
    y += 6;
    doc.text(
      `Humidity: ${weather.current.humidity}% | Wind: ${weather.current.windSpeed} km/h`,
      25,
      y
    );
    y += 10;

    if (weather.forecast && weather.forecast.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Daily Forecast:", 25, y);
      y += 5;

      weather.forecast.slice(0, 5).forEach((day) => {
        checkPageBreak();
        doc.setTextColor(0, 0, 0);
        doc.text(
          `${day.date}: ${day.temp}°C (${day.minTemp}° - ${day.maxTemp}°) | ${day.condition}`,
          25,
          y
        );
        y += 5;
      });
    }
    y += 10;
  }

  // Railway Options Section
  if (railways.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setTextColor(147, 51, 234);
    doc.text("Railway Options", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    railways.forEach((train, idx) => {
      checkPageBreak(25);
      doc.setTextColor(147, 51, 234);
      doc.text(`${idx + 1}. ${train.trainName} (${train.trainNumber})`, 25, y);
      y += 6;

      doc.setTextColor(0, 0, 0);
      doc.text(`   Class: ${train.class} | Price: ${train.price}`, 25, y);
      y += 5;
      doc.text(
        `   Duration: ${train.duration} | Dep: ${train.departureTime} | Arr: ${train.arrivalTime}`,
        25,
        y
      );
      y += 8;
    });
    y += 5;
  }

  // Hotels Section
  if (hotels.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(16);
    doc.setTextColor(147, 51, 234);
    doc.text("Recommended Hotels", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    hotels.forEach((hotel, idx) => {
      checkPageBreak(20);
      doc.text(
        `${idx + 1}. ${hotel.name} - ${hotel.price} (Rating: ${hotel.rating})`,
        25,
        y
      );
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`   ${hotel.address}`, 25, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    });
    y += 10;
  }

  // Daily Itinerary Section
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setTextColor(147, 51, 234);
  doc.text("Daily Itinerary", 20, y);
  y += 12;

  itinerary.days.forEach((day) => {
    checkPageBreak(30);

    // Day Header
    doc.setFontSize(13);
    doc.setTextColor(147, 51, 234);
    doc.text(`Day ${day.day} - ${day.date}`, 20, y);
    y += 8;

    // Activities
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    day.activities.forEach((activity) => {
      checkPageBreak();
      const activityText = `${activity.time}: ${activity.activity} - ${activity.cost}`;
      const lines = doc.splitTextToSize(activityText, 165);
      doc.text(lines, 25, y);
      y += lines.length * 5;
    });

    y += 8;
  });

  // Footer on last page
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    105,
    285,
    { align: "center" }
  );

  // Save the PDF
  const fileName = `${itinerary.destination.replace(/\s+/g, "-")}-trip-itinerary.pdf`;
  doc.save(fileName);
}