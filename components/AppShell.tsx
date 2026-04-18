"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import IntroOverlay from "./IntroOverlay";
import LoginScreen from "./LoginScreen";
import { useAuth } from "@/lib/auth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [introComplete, setIntroComplete] = useState(false);
  const { user, loading } = useAuth();

  const isLanding = pathname === "/";

  const showApp   = introComplete && !loading && !!user;
  const showLogin = introComplete && !loading && !user;

  return (
    <>
      {showApp && (
        isLanding ? (
          <>{children}</>
        ) : (
          <div className="flex min-h-screen relative z-10">
            <Sidebar />
            <div className="flex-1 min-w-0 overflow-y-auto">
              <main className="max-w-3xl mx-auto px-5 py-7">{children}</main>
            </div>
          </div>
        )
      )}

      {showLogin && <LoginScreen />}

      {!introComplete && (
        <IntroOverlay onComplete={() => setIntroComplete(true)} />
      )}
    </>
  );
}
