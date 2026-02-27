"use client";

import { SessionProvider } from "next-auth/react";
import ConditionalHeader from "@/components/ui/ConditionalHeader";

function ClientProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <ConditionalHeader />
      {children}
    </SessionProvider>
  );
}

export default ClientProvider;