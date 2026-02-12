"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/buttonprimary";

export default function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className="w-full text-white px-8 py-4 flex justify-between items-center">
      {/* Logo */}
            <div className="flex gap-3 items-center cursor-pointer">
              <Image src="logo.svg" alt="logo" width={25} height={25} />
              <h2 className="font-bold text-2xl hover:text-purple-500 cursor-pointer">
                Smart Trip Planner
              </h2>
            </div>

      {/* Right Side */}
      {/* <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {session?.user?.name}
        </span> */}

        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-white text-black px-4 py-2 rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          Sign Out
        </Button>
      {/* </div> */}
    </header>
  );
}
