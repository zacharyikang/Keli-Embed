"use client";

import { createContext, useContext } from "react";

export type ToastType = "info" | "success" | "error" | "warning";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

export type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

export const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
