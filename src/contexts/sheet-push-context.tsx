"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

type SheetPushContextValue = {
  sheetWidthPx: number;
  setSheetOpen: (open: boolean, widthPx?: number) => void;
};

const SheetPushContext = createContext<SheetPushContextValue | null>(null);

export function SheetPushProvider({ children }: { children: React.ReactNode }) {
  const [sheetWidthPx, setSheetWidthPx] = useState(0);

  const setSheetOpen = useCallback((open: boolean, widthPx?: number) => {
    setSheetWidthPx(open && widthPx != null ? widthPx : 0);
  }, []);

  return (
    <SheetPushContext.Provider value={{ sheetWidthPx, setSheetOpen }}>
      {children}
    </SheetPushContext.Provider>
  );
}

export function useSheetPush() {
  const ctx = useContext(SheetPushContext);
  return ctx;
}
