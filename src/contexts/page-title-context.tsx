"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PageTitleContextType {
  title: string | null;
  subtitle: string | null;
  setTitle: (title: string | null) => void;
  setSubtitle: (subtitle: string | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(
  undefined
);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);

  return (
    <PageTitleContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error("usePageTitle must be used within a PageTitleProvider");
  }
  return context;
}

