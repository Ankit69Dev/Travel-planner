"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          `
          relative
          px-7 py-3
          rounded-full
          font-semibold
          text-white
          overflow-hidden
          border-none
          cursor-pointer
          
          bg-gradient-to-br from-[#9700fc] to-[#2f00ff]
          transition-all duration-300 ease-in-out
          hover:shadow-[0_0_40px_rgba(151,0,252,0.7)]
          active:shadow-[0_0_20px_rgba(151,0,252,0.5)]
          active:translate-y-0
          before:content-['']
          before:absolute
          before:inset-0
          before:bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.4),transparent_80%)]
          before:translate-x-[-100%]
          before:transition-transform
          before:duration-700
          hover:before:translate-x-[100%]
          `,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
