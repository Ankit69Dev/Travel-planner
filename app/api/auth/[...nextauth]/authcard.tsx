"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Card */}
      <div className="bg-gradient-to-br from-black via-zinc-900 to-black border border-zinc-800 text-white p-10 rounded-2xl shadow-2xl w-[90%] max-w-[600px] h-[250px] relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-3 right-4 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
       
          <Image src="logo.svg" alt="logo" width={25} height={25} />
          <h2 className="flex text-2xl font-bold mb-6 text-center ml-10 -mt-8"> Smart Trip Planner </h2>
          <h3 className="flex text-lg mb-6 ml-4">Sign in the App with Google authentication securely.</h3>
        
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}

          className="w-full flex items-center justify-center gap-3 cursor-pointer bg-white text-black font-semibold py-3 rounded-lg hover:scale-105 transition-all duration-300"
        >
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
