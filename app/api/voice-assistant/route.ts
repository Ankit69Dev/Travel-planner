import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const stageQuestionsHindi: { [key: number]: string } = {
  0: "कृपया मुझे बताएं कि आप कहाँ से यात्रा शुरू करना चाहते हैं?",
  1: "बहुत अच्छा! अब मुझे बताएं कि आप कहाँ जाना चाहते हैं?",
  2: "शानदार! अब मुझे यात्रा की तारीख बताएं। आप कब जाना चाहते हैं?",
  3: "अच्छा! कितने लोग यात्रा कर रहे हैं? अकेले, दो लोग, या समूह में?",
  4: "ठीक है! आपका बजट क्या है? कम, मध्यम, या उच्च?",
  5: "बढ़िया! आप किस परिवहन से यात्रा करना चाहते हैं? बस या ट्रेन?",
};

const stageQuestionsEnglish: { [key: number]: string } = {
  0: "Please tell me where you're starting your journey from?",
  1: "Great! Now tell me where you want to go?",
  2: "Awesome! When do you want to travel? Please tell me the dates.",
  3: "Perfect! How many travelers? Solo, duo, or group?",
  4: "Got it! What's your budget? Low, moderate, or high?",
  5: "Excellent! Which transport mode? Bus or train?",
};

export async function POST(request: NextRequest) {
  try {
    const { input, stage, collectedData, language = "hindi" } = await request.json();

    console.log(`🎤 Stage ${stage}: Processing input in ${language}:`, input);

    const stageQuestions = language === "hindi" ? stageQuestionsHindi : stageQuestionsEnglish;
    const systemLanguage = language === "hindi" ? "Hindi" : "English";

    const extractionPrompt = `You are a ${systemLanguage} travel assistant. Extract travel information from the user's ${systemLanguage} input.

Current stage: ${stage}
Stage descriptions:
0 = Starting location
1 = Destination
2 = Travel dates
3 = Number of travelers (Solo/Duo/Group)
4 = Budget (Low/Moderate/High)
5 = Transport mode (Bus/Train)

User said (in ${systemLanguage}): "${input}"

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
  "response": "A natural ${systemLanguage} response confirming what you understood",
  "nextStage": ${stage + 1},
  "complete": ${stage >= 5}
}

IMPORTANT: 
- Respond ONLY in ${systemLanguage}
- Return ONLY valid JSON, no extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful ${systemLanguage} travel assistant that extracts travel information. Always respond in ${systemLanguage} and return valid JSON.`,
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

    const updatedData = {
      ...collectedData,
      ...parsedResponse.extractedData,
    };

    let finalResponse = parsedResponse.response;
    if (!parsedResponse.complete && stageQuestions[parsedResponse.nextStage]) {
      finalResponse += " " + stageQuestions[parsedResponse.nextStage];
    } else if (parsedResponse.complete) {
      finalResponse += language === "hindi"
        ? " धन्यवाद! अब मैं आपके लिए यात्रा योजना तैयार कर रहा हूँ..."
        : " Thank you! Now I'm preparing your travel plan...";
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
        response: "Sorry, I couldn't understand. Please try again.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}