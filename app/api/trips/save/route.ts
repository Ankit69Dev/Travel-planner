import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { itinerary, weather, hotels, railways } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Save trip
    const trip = await prisma.trip.create({
      data: {
        userId: user.id,
        startLocation: itinerary.startLocation,
        destination: itinerary.destination,
        startDate: itinerary.dates.split(" to ")[0],
        endDate: itinerary.dates.split(" to ")[1],
        travelers: itinerary.travelers,
        budget: itinerary.budget,
        transport: itinerary.transport.mode,
        itinerary: itinerary,
        weather: weather || null,
        hotels: hotels || null,
        railways: railways || null,
      },
    });

    return NextResponse.json({ success: true, trip });
  } catch (error: any) {
    console.error("Save trip error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}