"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Button } from "@/components/ui/buttonprimary";
import { useState } from "react";
import AuthModal from "@/app/api/auth/[...nextauth]/authcard";

const menuOptions = [
  { name: "Home", path: "/" },
  { name: "About", path: "#about" },
  { name: "Our Team", path: "#ourteam"}
];


function Header() {
  const [openAuth, setOpenAuth] = useState(false);
  return (
    <div className="flex justify-between items-center p-4">

      {/* Logo */}

      <div className="flex gap-3 items-center cursor-pointer">
        <Image src="logo.svg" alt="logo" width={25} height={25} />
        <Link href={"/"}><h2 className="font-bold text-2xl hover:text-purple-500 cursor-pointer">
          Smart Trip Planner
        </h2>
        </Link>
      </div>

      {/* Menu Options */}

      <div className="flex gap-8 mr-80">
        {menuOptions.map((menu) => (
          <Link
            key={menu.path}
            href={menu.path}
            className="
              relative
              text-lg
              transition-all
              duration-300
              hover:scale-105
              hover:text-purple-500
              after:content-['']
              after:block
              after:h-[2px]
              after:w-0
              after:bg-purple-500
              after:transition-all
              after:duration-300
              hover:after:w-full
            "
          >
            {menu.name}
          </Link>
        ))}
      </div>
      <AuthModal isOpen={openAuth} onClose={() => setOpenAuth(false)} />
        
      {/* Get Started Button */}

      <Button className="cursor-pointer" onClick={() => setOpenAuth(true)}>
        Sign In
      </Button>
    </div>

    
  );
}

export default Header;
