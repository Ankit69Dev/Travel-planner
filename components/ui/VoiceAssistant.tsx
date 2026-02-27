"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceAssistantProps {
  onTripDataExtracted: (data: any) => void;
  onClose: () => void;
}

export default function VoiceAssistant({ onTripDataExtracted, onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("नमस्ते! मैं आपकी यात्रा योजना में मदद करूंगा। कृपया मुझे बताएं कि आप कहाँ से शुरू करना चाहते हैं?");
  const [conversation, setConversation] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [collectedData, setCollectedData] = useState<any>({});

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "hi-IN";

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);

          if (finalTranscript) {
            processVoiceInput(finalTranscript.trim());
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processVoiceInput = async (input: string) => {
    setProcessing(true);
    stopListening();

    setConversation((prev) => [...prev, { role: "user", text: input }]);

    try {
      const response = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          stage,
          collectedData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const { response: aiText, extractedData, nextStage, complete } = data;

        setAiResponse(aiText);
        setConversation((prev) => [...prev, { role: "assistant", text: aiText }]);
        speak(aiText);

        if (extractedData) {
          setCollectedData((prev: any) => ({ ...prev, ...extractedData }));
        }

        if (complete) {
          setTimeout(() => {
            onTripDataExtracted(collectedData);
          }, 2000);
        } else {
          setStage(nextStage);
          setTimeout(() => {
            startListening();
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error processing voice:", error);
      const errorMsg = "क्षमा करें, कुछ गलत हो गया। कृपया फिर से प्रयास करें।";
      setAiResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal - Centered */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-900/95 to-blue-900/95 rounded-3xl border-2 border-purple-500/50 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-400 p-6 flex items-center justify-between sticky top-0 z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI यात्रा सहायक</h2>
              <p className="text-purple-100 text-sm">हिंदी में बोलें</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {["शुरुआत", "गंतव्य", "तारीख", "यात्री", "बजट", "परिवहन"].map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    idx <= stage
                      ? "bg-green-500 text-white"
                      : "bg-white/20 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 5 && (
                  <div
                    className={`w-6 md:w-10 h-1 ${
                      idx < stage ? "bg-green-500" : "bg-white/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* AI Response */}
          <div className="bg-white/10 rounded-xl p-5 min-h-[120px]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white text-lg leading-relaxed">{aiResponse}</p>
              </div>
            </div>
          </div>

          {/* Conversation History */}
          {conversation.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 max-h-[200px] overflow-y-auto space-y-3">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-xl ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Transcript */}
          {transcript && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <p className="text-yellow-200 text-sm mb-1">आप बोल रहे हैं:</p>
              <p className="text-white font-semibold">{transcript}</p>
            </div>
          )}

          {/* Collected Data */}
          {Object.keys(collectedData).length > 0 && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <p className="text-green-200 text-sm mb-2">✅ एकत्रित जानकारी:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {collectedData.startLocation && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">📍 शुरुआत:</span><br/>
                    <span className="font-semibold">{collectedData.startLocation}</span>
                  </div>
                )}
                {collectedData.destination && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">🎯 गंतव्य:</span><br/>
                    <span className="font-semibold">{collectedData.destination}</span>
                  </div>
                )}
                {collectedData.startDate && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">📅 तारीख:</span><br/>
                    <span className="font-semibold">{collectedData.startDate}</span>
                  </div>
                )}
                {collectedData.travelers && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">👥 यात्री:</span><br/>
                    <span className="font-semibold">{collectedData.travelers}</span>
                  </div>
                )}
                {collectedData.budget && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">💰 बजट:</span><br/>
                    <span className="font-semibold">{collectedData.budget}</span>
                  </div>
                )}
                {collectedData.transport && (
                  <div className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">🚂 परिवहन:</span><br/>
                    <span className="font-semibold">{collectedData.transport}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mic Button */}
          <div className="flex flex-col items-center gap-4 py-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={processing}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                isListening
                  ? "bg-red-500 animate-pulse shadow-red-500/50"
                  : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/50"
              } disabled:opacity-50`}
            >
              {processing ? (
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : isListening ? (
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}

              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-pulse" />
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {isListening ? "🎤 सुन रहा हूँ..." : "माइक पर क्लिक करें"}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                {isListening ? "हिंदी में बोलें" : "हिंदी में अपनी यात्रा की जानकारी दें"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}