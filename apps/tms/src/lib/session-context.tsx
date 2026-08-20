"use client";

import { createContext, useCallback, useContext } from "react";

import { hasPerm } from "./perms";
import type { Bootstrap } from "./types";

const SessionContext = createContext<Bootstrap | null>(null);

export function SessionProvider({ children, value }: { children: React.ReactNode; value: Bootstrap }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useBootstrap(): Bootstrap {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useBootstrap must be used inside SessionProvider");
  return ctx;
}

export function useCan(): (perm: string) => boolean {
  const { permissions } = useBootstrap();
  return useCallback((perm: string) => hasPerm(permissions, perm), [permissions]);
}
