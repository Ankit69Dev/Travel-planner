"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceAssistantProps {
  onTripDataExtracted: (data: any) => void;
  onClose: () => void;
}

export default function VoiceAssistant({ onTripDataExtracted, onClose }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<"hindi" | "english">("hindi");
  const [aiResponse, setAiResponse] = useState("नमस्ते! मैं आपकी यात्रा योजना में मदद करूंगा। कृपया मुझे बताएं कि आप कहाँ से शुरू करना चाहते हैं?");
  const [conversation, setConversation] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState(0);
  const [collectedData, setCollectedData] = useState<any>({});
  const [error, setError] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (language === "hindi") {
      setAiResponse("नमस्ते! मैं आपकी यात्रा योजना में मदद करूंगा। कृपया मुझे बताएं कि आप कहाँ से शुरू करना चाहते हैं?");
    } else {
      setAiResponse("Hello! I'll help you plan your trip. Please tell me where you're starting from?");
    }
  }, [language]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
      setTranscript(language === "hindi" ? "रिकॉर्डिंग..." : "Recording...");
    } catch (err: any) {
      console.error("Microphone error:", err);
      setError(language === "hindi"
        ? "माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया अनुमति दें या टाइप करें।"
        : "Microphone access denied. Please allow or type.");
      setUseTextInput(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTranscript(language === "hindi" ? "प्रोसेसिंग..." : "Processing...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);

      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.transcript) {
        setTranscript(data.transcript);
        processVoiceInput(data.transcript);
      } else {
        throw new Error(data.error || "No transcript received");
      }
    } catch (error: any) {
      console.error("Transcription error:", error);
      setError(language === "hindi"
        ? "ऑडियो प्रोसेस नहीं हो सका। कृपया फिर से प्रयास करें।"
        : "Couldn't process audio. Please try again.");
      setTranscript("");
      setProcessing(false);
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === "hindi" ? "hi-IN" : "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Text-to-speech error:", err);
      }
    }
  };

  const processVoiceInput = async (input: string) => {
    setConversation((prev) => [...prev, { role: "user", text: input }]);

    try {
      const response = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          stage,
          collectedData,
          language,
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
        }
      } else {
        throw new Error(data.error || "Failed to process input");
      }
    } catch (error: any) {
      console.error("Error processing voice:", error);
      const errorMsg = language === "hindi"
        ? "क्षमा करें, कुछ गलत हो गया। कृपया फिर से प्रयास करें।"
        : "Sorry, something went wrong. Please try again.";
      setAiResponse(errorMsg);
      setError(error.message || "Processing error");
      speak(errorMsg);
    } finally {
      setProcessing(false);
      setTranscript("");
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processVoiceInput(textInput.trim());
      setTextInput("");
    }
  };

  const toggleLanguage = () => {
    const newLang = language === "hindi" ? "english" : "hindi";
    setLanguage(newLang);
    
    if (isRecording) {
      stopRecording();
    }
    
    setConversation([]);
    setStage(0);
    setCollectedData({});
    setTranscript("");
    setTextInput("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md" 
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-900/95 to-pink-900/95 rounded-3xl border-2 border-purple-500/50 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between sticky top-0 z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {language === "hindi" ? "AI यात्रा सहायक" : "AI Travel Assistant"}
              </h2>
              <p className="text-purple-100 text-sm">
                {language === "hindi" ? "बोलें या टाइप करें" : "Speak or type"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <span className="text-2xl">{language === "hindi" ? "🇮🇳" : "🇬🇧"}</span>
              <span className="text-white font-semibold text-sm">
                {language === "hindi" ? "EN" : "हिं"}
              </span>
            </button>

            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-yellow-200 text-sm">{error}</p>
                </div>
                <button onClick={() => setError("")} className="text-yellow-300 hover:text-yellow-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            {(language === "hindi" 
              ? ["शुरुआत", "गंतव्य", "तारीख", "यात्री", "बजट", "परिवहन"]
              : ["Start", "Destination", "Dates", "Travelers", "Budget", "Transport"]
            ).map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
                    idx <= stage ? "bg-green-500 text-white" : "bg-white/20 text-gray-400"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 5 && (
                  <div className={`w-6 md:w-10 h-1 ${idx < stage ? "bg-green-500" : "bg-white/20"}`} />
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
                      msg.role === "user" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
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
              <p className="text-yellow-200 text-sm mb-1">
                {language === "hindi" ? "आप बोल रहे हैं:" : "You're saying:"}
              </p>
              <p className="text-white font-semibold">{transcript}</p>
            </div>
          )}

          {/* Collected Data */}
          {Object.keys(collectedData).length > 0 && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <p className="text-green-200 text-sm mb-2">
                {language === "hindi" ? "✅ एकत्रित जानकारी:" : "✅ Collected Information:"}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(collectedData).map(([key, value]: any) => (
                  <div key={key} className="text-white bg-white/5 rounded-lg p-2">
                    <span className="text-gray-300">{key}:</span><br/>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Section */}
          <div className="flex flex-col items-center gap-4 py-4">
            {!useTextInput ? (
              <>
                {/* Voice Button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={processing}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                    isRecording
                      ? "bg-red-500 animate-pulse shadow-red-500/50"
                      : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {processing ? (
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
                  )}
                </button>

                <div className="text-center">
                  <p className="text-white font-semibold text-lg">
                    {isRecording 
                      ? (language === "hindi" ? "🔴 रिकॉर्डिंग... क्लिक करके रोकें" : "🔴 Recording... Click to stop")
                      : (language === "hindi" ? "माइक पर क्लिक करें" : "Click to record")}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    {language === "hindi" ? "या नीचे टाइप करें" : "Or type below"}
                  </p>
                </div>

                <button
                  onClick={() => setUseTextInput(true)}
                  className="text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  {language === "hindi" ? "टेक्स्ट इनपुट का उपयोग करें" : "Use text input"}
                </button>
              </>
            ) : (
              <>
                {/* Text Input */}
                <div className="w-full">
                  <p className="text-white text-center mb-3">
                    {language === "hindi" ? "अपना जवाब टाइप करें:" : "Type your response:"}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleTextSubmit()}
                      placeholder={language === "hindi" ? "यहाँ टाइप करें..." : "Type here..."}
                      disabled={processing}
                      className="flex-1 px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={processing || !textInput.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      {processing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setUseTextInput(false)}
                  className="text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  {language === "hindi" ? "वॉयस इनपुट आज़माएं" : "Try voice input"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}