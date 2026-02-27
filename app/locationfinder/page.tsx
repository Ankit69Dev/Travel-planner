"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";

const LocationMap = dynamic(() => import("@/components/ui/LocationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900/50 rounded-2xl border border-purple-500/30 flex items-center justify-center">
      <div className="text-purple-400 text-sm animate-pulse">Loading map…</div>
    </div>
  ),
});

interface PlaceResult {
  name: string;
  city: string;
  country: string;
  description: string;
  landmark: string;
  confidence: "high" | "medium" | "low";
  lat: number;
  lng: number;
  displayName: string;
}

type PipelineStatus =
  | "idle"
  | "resizing"
  | "captioning"
  | "extracting"
  | "geocoding"
  | "done"
  | "error";

async function resizeImageToBlob(file: File, maxDim = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load for resizing"));
    };
    img.src = url;
  });
}


async function captionImageWithBLIP(
  imageBlob: Blob,
  hfToken: string
): Promise<string> {
  const res = await fetch(
    "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "image/jpeg",
      },
      body: imageBlob,
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 503) {
      throw new Error(
        "HF model is warming up (cold start). Please wait 20–30 seconds and try again."
      );
    }
    if (res.status === 401) {
      throw new Error(
        "Invalid HF token. Check NEXT_PUBLIC_HF_TOKEN in your .env.local file."
      );
    }
    throw new Error(`BLIP API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  console.log("[BLIP] raw response:", json);

  const caption: string =
    json?.[0]?.generated_text ?? json?.generated_text ?? "";

  if (!caption) {
    throw new Error(
      "BLIP returned an empty caption. Try a clearer photo with a visible landmark."
    );
  }

  return caption;
}

async function extractLocationWithQwen(
  caption: string,
  hfToken: string
): Promise<{
  name: string;
  city: string;
  country: string;
  landmark: string;
  description: string;
  confidence: string;
}> {
  const prompt = `You are a world-class travel geographer. An AI vision model analyzed an image and produced this caption:

"${caption}"

Based on this caption, identify the specific real-world place, landmark, monument, or location being described.

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation before or after the JSON.

{"name":"exact name of the place or monument","city":"city or nearest major city","country":"country name","landmark":"full geocodable search string e.g. Eiffel Tower Paris France","description":"2-3 sentences about this place useful for a traveller","confidence":"high or medium or low"}

If the caption does not clearly describe any recognisable real-world location, return:
{"name":"Unknown Location","city":"","country":"","landmark":"","description":"Could not identify a specific location from this image.","confidence":"low"}`;

  const res = await fetch(
    "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 400,
        stream: false,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 503) {
      throw new Error(
        "Qwen model is warming up. Please wait 20–30 seconds and try again."
      );
    }
    throw new Error(`Qwen API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log("[Qwen] raw response:", data);

  const raw: string = data.choices?.[0]?.message?.content ?? "";
  console.log("[Qwen] content:", raw);
  const stripped = raw.replace(/```json|```/gi, "").trim();
  const match = stripped.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error(
      `Qwen did not return valid JSON. Response was: "${raw.slice(0, 300)}"`
    );
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    throw new Error(
      `JSON parse failed. Content was: "${match[0].slice(0, 300)}"`
    );
  }
}

async function geocode(
  landmark: string,
  city: string,
  country: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const queries = [
    landmark,
    `${landmark} ${city} ${country}`,
    `${city} ${country}`,
    city,
  ]
    .map((q) => q.trim())
    .filter((q) => q.length > 1);

  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=json&limit=1&addressdetails=1`;
      const r = await fetch(url, {
        headers: { "User-Agent": "SmartTripPlanner/1.0 contact@example.com" },
      });
      const json = await r.json();
      if (json?.length > 0) {
        return {
          lat: parseFloat(json[0].lat),
          lng: parseFloat(json[0].lon),
          displayName: json[0].display_name,
        };
      }
    } catch {
    }
  }
  return null;
}

function ConfidenceBadge({ level }: { level: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    high: {
      label: "High Confidence",
      cls: "bg-green-500/20 text-green-300 border-green-500/30",
    },
    medium: {
      label: "Medium Confidence",
      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    },
    low: {
      label: "Low Confidence",
      cls: "bg-red-500/20 text-red-300 border-red-500/30",
    },
  };
  const c = cfg[level] ?? cfg.low;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${c.cls}`}>
      {c.label}
    </span>
  );
}

function StepIndicator({
  step,
  label,
  active,
  done,
}: {
  step: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 transition-all duration-300 ${
        active ? "opacity-100" : done ? "opacity-70" : "opacity-25"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all ${
          done
            ? "bg-green-500/20 border-green-500 text-green-300"
            : active
            ? "bg-purple-500/30 border-purple-400 text-purple-300 animate-pulse"
            : "bg-white/5 border-white/20 text-gray-500"
        }`}
      >
        {done ? "✓" : step}
      </div>
      <span
        className={`text-xs font-medium ${
          active ? "text-purple-300" : done ? "text-green-300" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
      <div className="absolute inset-0 bg-orange-500/5" />
      <div
        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-90"
        style={{ animation: "scanLine 1.8s linear infinite" }}
      />
      {[
        "top-3 left-3 border-t-2 border-l-2",
        "top-3 right-3 border-t-2 border-r-2",
        "bottom-3 left-3 border-b-2 border-l-2",
        "bottom-3 right-3 border-b-2 border-r-2",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-7 h-7 border-orange-400 ${cls}`} />
      ))}
      <style>{`
        @keyframes scanLine {
          0%   { top: 0%;   opacity: 1; }
          85%  { top: 100%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function ImageLocationFinder() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [caption, setCaption] = useState<string>("");
  const [result, setResult] = useState<PlaceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const busy = ["resizing", "captioning", "extracting", "geocoding"].includes(status);

  // ── File handling ──────────────────────────────────────────────────────────
  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImageFile(file);
    setResult(null);
    setErrorMsg("");
    setCaption("");
    setStatus("idle");
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  };

  // ── Main 4-step pipeline ──────────────────────────────────────────────────
  const analyse = async () => {
    if (!imageFile) return;

    const hfToken = process.env.NEXT_PUBLIC_HF_TOKEN;
    if (!hfToken) {
      setStatus("error");
      setErrorMsg(
        "NEXT_PUBLIC_HF_TOKEN is missing from your .env.local file. Get a free token at huggingface.co/settings/tokens"
      );
      return;
    }

    setResult(null);
    setCaption("");
    setErrorMsg("");

    try {
      // Step 1: Resize
      setStatus("resizing");
      const blob = await resizeImageToBlob(imageFile, 512);

      // Step 2: BLIP image captioning
      setStatus("captioning");
      const cap = await captionImageWithBLIP(blob, hfToken);
      setCaption(cap);
      console.log("[Pipeline] BLIP caption:", cap);

      // Step 3: Qwen location extraction
      setStatus("extracting");
      const identified = await extractLocationWithQwen(cap, hfToken);
      console.log("[Pipeline] Identified:", identified);

      if (
        !identified.name ||
        identified.name === "Unknown Location" ||
        !identified.landmark
      ) {
        throw new Error(
          `Could not identify a recognisable location. BLIP described the image as: "${cap}". Try a clearer photo of a well-known landmark or monument.`
        );
      }

      // Step 4: Geocode to lat/lng
      setStatus("geocoding");
      const geo = await geocode(
        identified.landmark,
        identified.city,
        identified.country
      );

      if (!geo) {
        throw new Error(
          `Found the place "${identified.name}" but could not get map coordinates for "${identified.landmark}". Try a more specific image of a famous landmark.`
        );
      }

      setResult({
        name: identified.name,
        city: identified.city,
        country: identified.country,
        description: identified.description,
        landmark: identified.landmark,
        confidence: identified.confidence as PlaceResult["confidence"],
        lat: geo.lat,
        lng: geo.lng,
        displayName: geo.displayName,
      });
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  // ── Send identified place to dashboard ────────────────────────────────────
  const sendToDashboard = () => {
    if (!result) return;
    sessionStorage.setItem(
      "imagefinderDestination",
      JSON.stringify({
        name: result.city || result.name,
        displayName: result.displayName,
        lat: result.lat,
        lng: result.lng,
        country: result.country,
      })
    );
    router.push("/dashboard?mode=imagefinder");
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setErrorMsg("");
    setCaption("");
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Pipeline step helpers ─────────────────────────────────────────────────
  const STATUS_ORDER: PipelineStatus[] = [
    "resizing", "captioning", "extracting", "geocoding", "done",
  ];
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isStepActive = (key: string) => status === key;
  const isStepDone = (key: string) => {
    const stepIdx = STATUS_ORDER.indexOf(key as PipelineStatus);
    return currentIdx > stepIdx || status === "done";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pt-28 pb-16 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">

        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Hero header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-300 text-xs font-semibold uppercase tracking-widest">
              Powered by Hugging Face · BLIP + Qwen2.5-72B · 100% Free
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            📸 Image Location Finder
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Drop any photo of a place or monument. Hugging Face AI identifies it
            and pins it on the map — ready to set as your trip destination.
          </p>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ═══════════════ LEFT: Upload + Pipeline + Result ═══════════════ */}
          <div className="flex flex-col gap-5">

            {/* Drop zone */}
            <div
              onClick={() => !imagePreview && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
                ${imagePreview ? "border-orange-500/50 cursor-default" : "cursor-pointer hover:border-orange-400"}
                ${isDragging ? "border-orange-400 bg-orange-500/5 scale-[1.01]" : "border-orange-500/30 bg-white/5"}
              `}
              style={{ minHeight: "300px" }}
            >
              {!imagePreview ? (
                /* Empty drop zone */
                <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-4xl">
                    🤗
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg mb-1">
                      Drop your photo here
                    </p>
                    <p className="text-gray-400 text-sm">
                      or click to browse · JPG, PNG, WebP
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-1">
                    {[
                      "🗼 Eiffel Tower",
                      "🕌 Taj Mahal",
                      "🏛️ Colosseum",
                      "🌉 Golden Gate",
                      "🏯 Red Fort",
                    ].map((ex) => (
                      <span
                        key={ex}
                        className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-gray-500"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                /* Image preview */
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Uploaded place"
                    className="w-full object-cover rounded-2xl"
                    style={{ maxHeight: "360px" }}
                  />
                  {busy && <ScanOverlay />}
                  <div className="absolute top-3 right-3 flex gap-2 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="p-2 bg-black/60 hover:bg-black/80 backdrop-blur rounded-lg border border-white/10 text-white transition-all"
                      title="Change image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="p-2 bg-black/60 hover:bg-red-500/40 backdrop-blur rounded-lg border border-white/10 text-white transition-all"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Pipeline step tracker */}
            {(busy || status === "done" || status === "error") && (
              <div className="bg-black/40 rounded-2xl border border-white/10 px-5 py-4 flex flex-col gap-3">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                  🤗 HF Processing Pipeline
                </p>
                {[
                  { step: 1, label: "Resize image for HF API",        key: "resizing"   },
                  { step: 2, label: "BLIP vision: image → caption",    key: "captioning" },
                  { step: 3, label: "Qwen2.5-72B: caption → location", key: "extracting" },
                  { step: 4, label: "Nominatim: geocode to lat/lng",   key: "geocoding"  },
                ].map(({ step, label, key }) => (
                  <StepIndicator
                    key={key}
                    step={step}
                    label={label}
                    active={isStepActive(key)}
                    done={isStepDone(key)}
                  />
                ))}

                {/* Show raw BLIP caption */}
                {caption && (
                  <div className="mt-2 bg-orange-500/5 rounded-xl p-3 border border-orange-500/20">
                    <p className="text-orange-400/70 text-[10px] uppercase tracking-wider mb-1 font-mono">
                      BLIP Vision Caption
                    </p>
                    <p className="text-gray-300 text-xs italic">"{caption}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Analyse button */}
            {imagePreview && status !== "done" && (
              <button
                onClick={analyse}
                disabled={busy}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-base shadow-lg shadow-orange-500/20"
              >
                {busy ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {status === "resizing"
                      ? "Preparing image…"
                      : status === "captioning"
                      ? "BLIP reading image…"
                      : status === "extracting"
                      ? "Qwen identifying location…"
                      : "Pinning on map…"}
                  </>
                ) : (
                  <>
                    <span className="text-xl">🤗</span>
                    Identify &amp; Locate This Place
                  </>
                )}
              </button>
            )}

            {/* Error panel */}
            {status === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-red-400 text-xl shrink-0">⚠️</span>
                <div className="min-w-0">
                  <p className="text-red-300 font-semibold text-sm mb-1">
                    Couldn't identify this place
                  </p>
                  <p className="text-red-400/80 text-xs leading-relaxed break-words">
                    {errorMsg}
                  </p>
                  <div className="flex gap-3 mt-2 flex-wrap">
                    <button
                      onClick={() => { setStatus("idle"); setErrorMsg(""); }}
                      className="text-xs text-red-300 hover:text-red-200 underline"
                    >
                      Retry same image
                    </button>
                    <span className="text-red-500/40 text-xs">·</span>
                    <button
                      onClick={reset}
                      className="text-xs text-red-300 hover:text-red-200 underline"
                    >
                      Try different image
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Result card */}
            {status === "done" && result && (
              <div className="bg-gray-900 border border-orange-500/30 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/10">
                <div className="bg-gradient-to-r from-orange-900/40 to-purple-900/50 px-5 py-4 border-b border-orange-500/20">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-white truncate">
                        {result.name}
                      </h2>
                      <p className="text-orange-300 text-sm mt-0.5">
                        {[result.city, result.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <ConfidenceBadge level={result.confidence} />
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {result.description}
                  </p>

                  {/* BLIP caption that led to this result */}
                  {caption && (
                    <div className="bg-orange-500/5 rounded-xl p-3 border border-orange-500/15">
                      <p className="text-orange-400/60 text-[10px] uppercase tracking-wider mb-1 font-mono">
                        AI Vision Caption
                      </p>
                      <p className="text-gray-400 text-xs italic">"{caption}"</p>
                    </div>
                  )}

                  {/* Coordinates */}
                  <div className="flex gap-3">
                    {[
                      { label: "Latitude",  val: result.lat.toFixed(5) },
                      { label: "Longitude", val: result.lng.toFixed(5) },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5"
                      >
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                          {c.label}
                        </p>
                        <p className="text-white font-mono text-sm font-semibold">
                          {c.val}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Full address from Nominatim */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                      Full Address
                    </p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      {result.displayName}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={sendToDashboard}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Set as Destination
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all text-sm"
                    >
                      Try Another
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════ RIGHT: MAP ═══════════════════ */}
          <div className="flex flex-col gap-4">
            <div
              className="backdrop-blur-md rounded-3xl border border-purple-500/50 p-5 shadow-xl flex flex-col gap-4"
              style={{ minHeight: "560px" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Live Location Map
                </h2>
                {result && (
                  <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-300 text-xs font-semibold">Located</span>
                  </div>
                )}
              </div>

              {result ? (
                <>
                  {/* Location chip */}
                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-2.5">
                    <span className="text-orange-400 text-lg">📍</span>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {result.name}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {[result.city, result.country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <div className="ml-auto text-right shrink-0">
                      <p className="text-orange-300 text-xs font-mono">
                        {result.lat.toFixed(3)}, {result.lng.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  {/* Leaflet Map */}
                  <div
                    className="flex-1 rounded-2xl overflow-hidden border border-purple-500/20"
                    style={{ minHeight: "400px" }}
                  >
                    <LocationMap
                      endLat={result.lat}
                      endLng={result.lng}
                      endName={result.name}
                    />
                  </div>

                  {/* Open in Google Maps */}
                  <a
                    href={`https://www.google.com/maps?q=${result.lat},${result.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 text-sm transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Google Maps
                  </a>
                </>
              ) : (
                /* Empty map state */
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 py-12">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-5xl">
                      🗺️
                    </div>
                    <div className="absolute -inset-3 rounded-full border border-orange-500/10 animate-ping" />
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Map will appear here</p>
                    <p className="text-gray-600 text-sm mt-1">
                      Upload a photo and identify a place to see it pinned on the map
                    </p>
                  </div>
                </div>
              )}
            </div>
              </div>
            </div>
          </div>
        </div>
      
  );
}