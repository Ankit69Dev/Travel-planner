"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/buttonprimary";
import { useState, useEffect } from "react";
const menuOptions = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Pilgrimage", path: "/pil" },
  { name: "Profile", path: "/pro" }
];

export default function DashboardHeader() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userLocation: "India" }),
      });

      const data = await response.json();

      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out?")) {
      signOut({ callbackUrl: "/" });
    }
  };
  return (
    <header className="w-full text-white px-8 py-4 flex justify-between items-center">
      {/* Logo */}
            <div className="flex gap-3 items-center cursor-pointer">
              <Image src="logo.svg" alt="logo" width={25} height={25} />
              <h2 className="font-bold text-2xl hover:text-purple-500 cursor-pointer">
                Smart Trip Planner
              </h2>
            </div>

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

      {/* Right Side - Navigation */}
          <div className="flex items-center gap-3">
            {/* Notification Icon */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  if (!notificationOpen && notifications.length === 0) {
                    fetchNotifications();
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all relative"
              >
                {loadingNotifications ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )}
                {notifications.length > 0 && !loadingNotifications && (
                  <>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                      {notifications.length}
                    </span>
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
                  </>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationOpen(false)}
                  />
                  
                  <div className="absolute top-14 right-0 w-96 bg-gray-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold text-lg">🎉 Travel Suggestions</h3>
                        <p className="text-purple-100 text-xs">AI-powered recommendations</p>
                      </div>
                      <button
                        onClick={() => setNotificationOpen(false)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="overflow-y-auto max-h-[400px]">
                      {loadingNotifications ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-gray-400">Loading suggestions...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-400 mb-3">No new suggestions</p>
                          <button
                            onClick={fetchNotifications}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            Refresh
                          </button>
                        </div>
                      ) : (
                        <div className="p-2">
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className="p-4 hover:bg-purple-500/10 rounded-xl cursor-pointer transition-all mb-2 border border-transparent hover:border-purple-500/30"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-4xl">{notif.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-1">
                                    <h4 className="text-white font-bold">{notif.title}</h4>
                                    <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                                      {notif.category}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                    {notif.message}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-purple-400 text-xs font-semibold">
                                      📍 {notif.destination}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      📅 {new Date(notif.date).toLocaleDateString('en-IN', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="border-t border-purple-500/30 p-3 bg-gray-800/50">
                        <button
                          onClick={fetchNotifications}
                          className="w-full py-2 text-purple-300 hover:text-purple-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh Suggestions
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

        

            {/* Sign Out Button with Confirmation */}
            <Button
              onClick={handleSignOut}
            >
              <span className="hidden md:block cursor-pointer">Sign Out</span>
            </Button>
            </div>
          
    </header>
  );
}

