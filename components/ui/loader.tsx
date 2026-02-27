"use client";

import { useEffect, useState } from "react";

export default function PurpleLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 25);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <h2 className="text-center text-purple-500 text-xl font-semibold mb-6">
          Loading
        </h2>
        <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden border border-purple-500/40">
          <div
            className="h-full bg-purple-500 transition-all duration-75 ease-linear shadow-lg shadow-purple-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-purple-400 mt-4 font-medium">
          {progress}%
        </p>

      </div>
    </div>
  );
}
