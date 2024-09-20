// components/SessionProviderWrapper.tsx
"use client"; // Mark this as a client component

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

const SessionProviderWrapper = ({ children }: { children: ReactNode }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
