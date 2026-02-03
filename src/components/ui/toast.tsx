"use client";

import * as React from "react";

type Toast = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((newToast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, ...newToast }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-6 top-6 z-50 space-y-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="w-80 rounded-lg border border-border bg-card px-4 py-3 shadow-lg"
          >
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            {item.description ? <p className="text-xs text-muted-foreground">{item.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
