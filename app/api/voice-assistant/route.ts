import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const stageQuestions: { [key: number]: string } = {
  0: "कृपया मुझे बताएं कि आप कहाँ से यात्रा शुरू करना चाहते हैं?",
  1: "बहुत अच्छा! अब मुझे बताएं कि आप कहाँ जाना चाहते हैं?",
  2: "शानदार! अब मुझे यात्रा की तारीख बताएं। आप कब जाना चाहते हैं?",
  3: "अच्छा! कितने लोग यात्रा कर रहे हैं? अकेले, दो लोग, या समूह में?",
  4: "ठीक है! आपका बजट क्या है? कम, मध्यम, या उच्च?",
  5: "बढ़िया! आप किस परिवहन से यात्रा करना चाहते हैं? बस या ट्रेन?",
};

export async function POST(request: NextRequest) {
  try {
    const { input, stage, collectedData } = await request.json();

    console.log(`🎤 Stage ${stage}: Processing input:`, input);

    // Use Groq AI to extract information from Hindi voice input
    const extractionPrompt = `You are a Hindi travel assistant. Extract travel information from the user's Hindi input.

Current stage: ${stage}
Stage descriptions:
0 = Starting location
1 = Destination
2 = Travel dates
3 = Number of travelers (Solo/Duo/Group)
4 = Budget (Low/Moderate/High)
5 = Transport mode (Bus/Train)

User said (in Hindi): "${input}"

Already collected data: ${JSON.stringify(collectedData)}

Extract the relevant information for stage ${stage} and return a JSON response:
{
  "extractedData": {
    // Add the extracted field based on current stage
    // Stage 0: "startLocation": "city name"
    // Stage 1: "destination": "city name"
    // Stage 2: "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"
    // Stage 3: "travelers": "Solo"/"Duo"/"Group"
    // Stage 4: "budget": "Low"/"Moderate"/"High"
    // Stage 5: "transport": "Bus"/"Train"
  },
  "response": "A natural Hindi response confirming what you understood",
  "nextStage": ${stage + 1},
  "complete": ${stage >= 5}
}

IMPORTANT: Return ONLY valid JSON, no extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful Hindi travel assistant that extracts travel information. Always respond in Hindi and return valid JSON.",
        },
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
    });

    let responseText = completion.choices[0].message.content || "";
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("🤖 AI Response:", responseText);

    const parsedResponse = JSON.parse(responseText);

    // Merge extracted data with collected data
    const updatedData = {
      ...collectedData,
      ...parsedResponse.extractedData,
    };

    // If complete, add the next question, otherwise ask the next stage question
    let finalResponse = parsedResponse.response;
    if (!parsedResponse.complete && stageQuestions[parsedResponse.nextStage]) {
      finalResponse += " " + stageQuestions[parsedResponse.nextStage];
    } else if (parsedResponse.complete) {
      finalResponse += " धन्यवाद! अब मैं आपके लिए यात्रा योजना तैयार कर रहा हूँ...";
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      extractedData: parsedResponse.extractedData,
      nextStage: parsedResponse.nextStage,
      complete: parsedResponse.complete,
      collectedData: updatedData,
    });
  } catch (error: any) {
    console.error("Voice assistant error:", error);
    return NextResponse.json(
      {
        success: false,
        response: "क्षमा करें, मुझे समझने में कुछ समस्या हुई। कृपया फिर से कोशिश करें।",
        error: error.message,
      },
      { status: 500 }
    );
  }
}