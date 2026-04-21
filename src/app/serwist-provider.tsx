"use client";

import { SerwistProvider } from "@serwist/next/react";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AppSerwistProvider({ children }: Props) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === "development"}
    >
      {children}
    </SerwistProvider>
  );
}
