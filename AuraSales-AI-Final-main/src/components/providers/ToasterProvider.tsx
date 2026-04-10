"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        classNames: {
          toast: "bg-slate-900 border border-slate-700 text-slate-50",
          title: "text-slate-50 font-semibold",
          description: "text-slate-300 text-sm",
          actionButton: "bg-blue-600 text-slate-950 font-medium",
          cancelButton: "bg-slate-700 text-slate-300",
          closeButton: "text-slate-400 hover:text-slate-200",
        },
      }}
    />
  );
}
