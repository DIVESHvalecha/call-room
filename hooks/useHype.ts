"use client";
import { useEffect } from "react";
export function useHype(value: number) {
  useEffect(() => {
    document.documentElement.style.setProperty("--hype", String(Math.min(1, Math.max(0, value))));
  }, [value]);
}
