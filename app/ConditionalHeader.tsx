"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "./_components/Header";
import DashboardHeader from "@/components/ui/DashboardHeader";

export default function ConditionalHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return null;
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (session && isDashboardRoute) {
    return <DashboardHeader />;
  }

  if (!isDashboardRoute) {
    return <Header />;
  }

  return null;
}