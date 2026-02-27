import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    const language = formData.get("language") as string || "hindi";

    if (!audioBlob) {
      return NextResponse.json(
        { success: false, error: "No audio provided" },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Deepgram API
    const deepgramResponse = await fetch(
      `https://api.deepgram.com/v1/listen?language=${language === "hindi" ? "hi" : "en"}&punctuate=true&model=nova-2`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm",
        },
        body: buffer,
      }
    );

    const result = await deepgramResponse.json();

    if (!deepgramResponse.ok) {
      throw new Error(result.err_msg || "Deepgram API error");
    }

    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || "";

    return NextResponse.json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    console.error("Speech-to-text error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process audio",
      },
      { status: 500 }
    );
  }
}