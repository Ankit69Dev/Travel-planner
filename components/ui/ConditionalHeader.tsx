"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import DashboardHeader from "@/components/ui/DashboardHeader";

export default function ConditionalHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return null;
  }

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isprofileRoute = pathname.startsWith("/profile");
  const isPilgrimageRoute = pathname.startsWith("/pilgrimage");
  if (session && isDashboardRoute) {
    return <DashboardHeader />;
  }

  if(session && isprofileRoute) {
    return <DashboardHeader/>;
  }

  if(session && isPilgrimageRoute){
    return <DashboardHeader/>;
  }

  if(!isDashboardRoute) {
    return <Header />;
  }

  return null;
}