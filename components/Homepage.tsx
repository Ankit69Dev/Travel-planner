"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/buttonsecondary";
import AuthModal from "@/app/api/auth/[...nextauth]/authcard";
import { Playball, Poppins } from "next/font/google";
import { Instagram, Linkedin } from "lucide-react";
import RevealLoader from "./ui/reveal-loader";

const playball = Playball({
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

function Homepage() {
  const [openAuth, setOpenAuth] = useState(false);

  const teamMembers = [
    {
      id: 1,
      img: "/devyansh.jpeg",
      name: "Devyansh Mandal",
      role: "Project Lead/Full-Stack Developer",
      instagram:
        "https://www.instagram.com/devyanshhh___25?igsh=MnY4azV0MWExdHBo",
      linkedin:
        "https://www.linkedin.com/in/devyansh-mandal-232497348?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    },
    {
      id: 2,
      img: "/ankit.jpeg",
      name: "Ankit Pandey",
      role: "Full-Stack Developer",
      instagram:
        "https://www.instagram.com/ankit.pandey03?igsh=aWVrOWI0Z3BkcDRn",
      linkedin:
        "https://www.linkedin.com/in/ankit-pandey-b50b87333?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    },
    {
      id: 3,
      img: "/pranshu.jpeg",
      name: "Pranshu Ranjan",
      role: "Full-Stack Developer",
      instagram:
        "https://www.instagram.com/bigbhangtheory144pixels?igsh=MTlrMmQ4OTdqbG44eg==",
      linkedin:
        "https://www.linkedin.com/in/pranshu-ranjan2026?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    },
    {
      id: 4,
      img: "/abhi.jpeg",
      name: "Abhijeet Anand",
      role: "Front-End Developer",
      instagram:
        "https://www.instagram.com/_iamabhijeetanand_?igsh=MXBoeDFobTNicWkzMA==",
      linkedin:
        "https://www.linkedin.com/in/devyansh-mandal-232497348?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    },
  ];

  return (
    <div>
      <RevealLoader />
      <div
        className={`${poppins.className} bg-black text-white w-full overflow-hidden scroll-smooth`}
      >
        {/* HERO SECTION */}
        <section className="relative flex px-50 pb-60 min-h-screen items-center">
          <div className="max-w-4xl flex flex-col z-10">
            <h1
              className={`${playball.className} text-7xl md:text-[170px] font-light leading-none tracking-wide bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent`}
            >
              Smart
            </h1>

            <h1 className="text-5xl md:text-8xl font-bold -mt-3 text-right">
              Trip Planner
            </h1>

            <p className="text-xl md:text-2xl mt-6 text-gray-300 font-light text-right">
              The fastest route is not always the smartest route
            </p>

            <div className="flex justify-end">
              <Button
                onClick={() => setOpenAuth(true)}
                className="mt-8 py-3 text-base bg-purple-600 hover:bg-purple-700 transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] right-110"
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Spline */}
          <div className="absolute left-250 -top-30 w-[900px] h-[900px]">
            <Spline scene="https://prod.spline.design/QT6CUnEa1C6ZFFoL/scene.splinecode" />
          </div>
        </section>

        {/* ABOUT US */}
        <section id="about" className="py-2 text-center px-70">
          <h2 className="text-4xl font-bold mb-16 text-purple-400 tracking-widest">
            ABOUT US
          </h2>

          <div className="grid md:grid-cols-3 gap-17">
            {[
              {
                title: "Smart Travel, Simplified",
                desc: `We make your trips smarter with the power of AI. Our smart trip planner uses intelligent technology to create personalized itineraries, suggest the best destinations, and optimize your travel plans effortlessly. Whether it’s a weekend getaway or a long vacation, we help you travel better, faster, and stress free.`,
              },
              {
                title: "Voice AI Travel Assistant",
                desc: `Just speak, and we’ll handle the rest! Our smart Voice AI Assistant listens to your travel plans, understands where you want to go, how many days you’re planning, and fills in all the details automatically. Fast, easy, and now available in Hindi making trip planning smoother than ever.`,
              },
              {
                title: "One-Click Spiritual Destinations",
                desc: `Planning a religious trip has never been easier. Choose your faith, tap once, and your destination is instantly set with the most popular sacred places — no manual search needed. Fast, simple, and designed to make your spiritual journey effortless`,
              },
            ].map((item, index) => (
              <div
                key={index}
                className=" border-white border-1 p-18 rounded-2xl backdrop-blur-md transition-all duration-500 hover:scale-105 hover:shadow-[0_0_35px_rgba(139,92,246,0.7)]"
              >
                <h1 className="font-semibold text-3xl mb-7 text-purple-400">
                  {item.title}
                </h1>
                <p className="text-white text-xl whitespace-pre-line">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-50 px-10 flex justify-center">
          <div className="border-white border-1 rounded-3xl p-12 max-w-4xl text-center backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]">
            <h2 className="text-3xl font-bold mb-8 text-purple-400 tracking-widest">
              HOW IT WORKS
            </h2>
            <p className="text-gray-300 text-xl leading-7">
              Our Smart Trip Planner makes travel effortless with the power of AI. Simply speak your travel plans to our Voice AI Assistant now available in Hindi and it automatically fills in your destination, trip duration, and preferences in seconds. You can also select one-click preset religious destinations to instantly plan your spiritual journey without manual entry. With intelligent AI-powered itinerary generation, we create personalized, smart travel plans tailored just for you making every trip faster, easier, and completely stress-free.
            </p>
          </div>
        </section>

        {/* TEAM SECTION */}
        <section id="ourteam" className="py-2 px-10 text-center">
          <h2 className="text-3xl font-semibold tracking-widest">
            MEET OUR TEAM
          </h2>
          <h3 className="text-5xl font-bold text-purple-500 mt-4 mb-16 tracking-wider">
            SPARKBYTE
          </h3>

          <div className="space-y-16 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => {
              const isEven = index % 2 === 0;

              return (
                <div
                  key={member.id}
                  className={`flex md:flex-row ${
                    !isEven ? "md:flex-row-reverse" : ""
                  } items-center justify-between gap-10 p-10 rounded-3xl border border-white transition-all duration-500 hover:scale-[1.02] hover:border-purple-500 hover:shadow-[0_0_45px_rgba(139,92,246,0.9)]`}
                >
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border border-gray-600 hover:border-purple-500 transition-all duration-500">
                    <img
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="max-w-3xl text-center md:text-left">
                    <h4 className="text-white text-3xl font-bold mb-1">
                      {member.name}
                    </h4>

                    <p className="text-gray-400 text-sm mb-4">{member.role}</p>

                    {/* ✅ Fixed Social Icons */}
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className=" cursor-pointer hover:text-pink-500 transition"
                      >
                        <Instagram size={20} />
                      </a>

                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className=" cursor-pointer hover:text-blue-600 transition"
                      >
                        <Linkedin size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/*  FOOTER  */}
        <footer className="bg-gray-900 text-white py-10 px-10 mt-20">
          <div className="max-w-6xl mx-200 font-bold flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h4 className="font-bold text-lg">Smart Trip Planner</h4>
              <p className="text-sm text-white">
                © {new Date().getFullYear()} All Rights Reserved
              </p>
            </div>
          </div>
        </footer>

        <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />
      </div>
    </div>
  );
}

export default Homepage;
