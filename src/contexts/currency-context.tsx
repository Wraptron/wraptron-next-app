"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CurrencyContextType = {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (value?: number, currencyOverride?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = "app_currency";
const DEFAULT_CURRENCY = "INR";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);

  // Load currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved) {
        setCurrencyState(saved);
      }
    }
  }, []);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    }
  };

  const formatCurrency = (value?: number, currencyOverride?: string): string => {
    if (!value) return "N/A";
    const currencyToUse = currencyOverride || currency;
    
    // Special handling for INR to show ₹ symbol
    if (currencyToUse === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyToUse,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
