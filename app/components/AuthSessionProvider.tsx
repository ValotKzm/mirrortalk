"use client";

import { createContext, useContext } from "react";

const SessionUserNameContext = createContext<string | null>(null);

export const AuthSessionProvider = ({
  accountName,
  children,
}: {
  accountName: string | null;
  children: React.ReactNode;
}) => (
  <SessionUserNameContext.Provider value={accountName}>
    {children}
  </SessionUserNameContext.Provider>
);

export const useSessionUserName = () => useContext(SessionUserNameContext);