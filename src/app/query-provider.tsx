"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60_000,
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    }),
  );

  // reducedMotion="user" disables transform/layout motion when the OS
  // prefers reduced motion — keeps CSS opacity/color transitions intact.
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
