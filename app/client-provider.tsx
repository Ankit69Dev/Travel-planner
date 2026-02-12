"use client";

import { SessionProvider } from "next-auth/react";
import Provider from "./provider"; // your existing provider
import React from "react";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider><Provider>{children}</Provider></SessionProvider>;
}
