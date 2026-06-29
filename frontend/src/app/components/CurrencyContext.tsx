"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyType = "USD" | "INR" | "EUR" | "GBP" | "JPY" | "AUD";

export interface CurrencyRates {
  USD: number;
  INR: number;
  EUR: number;
  GBP: number;
  JPY: number;
  AUD: number;
}

export const EXCHANGE_RATES: CurrencyRates = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.93,
  GBP: 0.79,
  JPY: 155.0,
  AUD: 1.51,
};

export const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
};

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  convert: (amount: number, from?: CurrencyType) => number;
  format: (amount: number, from?: CurrencyType) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("wanderwise_preferred_currency");
    if (saved) {
      setCurrencyState(saved as CurrencyType);
    }
  }, []);

  const setCurrency = (c: CurrencyType) => {
    setCurrencyState(c);
    localStorage.setItem("wanderwise_preferred_currency", c);
  };

  const convert = (amount: number, from: CurrencyType = "USD"): number => {
    if (from === currency) return amount;
    // Convert from source to USD base first
    const usdAmount = amount / EXCHANGE_RATES[from];
    // Convert from USD to target currency
    return Math.round(usdAmount * EXCHANGE_RATES[currency]);
  };

  const format = (amount: number, from: CurrencyType = "USD"): string => {
    const converted = convert(amount, from);
    return `${CURRENCY_SYMBOLS[currency]}${converted.toLocaleString()}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
