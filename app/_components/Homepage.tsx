"use client";
import React from "react";
import { Button } from "@/components/ui/buttonsecondary";
import "@fontsource/playball";
import dynamic from "next/dynamic";
import { signIn } from "next-auth/react";
import { useState } from "react";
import AuthModal from "@/app/api/auth/[...nextauth]/authcard";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});


function Homepage() {
  const [openAuth, setOpenAuth] = useState(false);
  return (
    <div className="mt-24 w-full flex px-50">
      {/* Content Wrapper */}
      <div className="max-w-3xl w-full flex flex-col items-start">
        <h1
          style={{ fontFamily: "Playball" }}
          className="text-xl md:text-8xl font-bold"
        >
          Smart
        </h1>

        <h1 className="text-3xl md:text-8xl font-bold">Trip Planner</h1>

        <p className="text-xl md:text-3xl font-semibold mt-6">
          The fastest route is not always the smartest route
        </p>
      </div>

      <div className="w-[900px] h-[900px] relative -top-50 right-[-100px]">
        <Spline scene="https://prod.spline.design/QT6CUnEa1C6ZFFoL/scene.splinecode" />
      </div>

        <Button className="absolute top-1/2 -translate-y-1/2" onClick={() => setOpenAuth(true)}>
          Get Started
        </Button> 

        <AuthModal
  isOpen={openAuth}
  onClose={() => setOpenAuth(false)}
/>
{/* <div className="mt-24 w-full flex px-50" >
  <h1 className="text-xl md:text-3xl font-semibold mt-">
    How It Works 
  </h1>
</div> */}
        
    </div>
  );
}

export default Homepage;
