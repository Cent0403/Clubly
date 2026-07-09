import { ToastOptions } from "react-hot-toast";

export function getToastOptions(darkMode: boolean): DefaultToastOptions {
  const baseStyle = {
    borderRadius: "0.85rem",
    border: `1px solid ${darkMode ? "#334155" : "#cbd5e1"}`,
    background: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#e2e8f0" : "#0f172a",
    fontSize: "0.75rem",
    boxShadow: darkMode
      ? "0 8px 24px rgba(2, 6, 23, 0.5)"
      : "0 8px 24px rgba(15, 23, 42, 0.12)",
  };

  return {
    duration: 3500,
    style: baseStyle,
    success: {
      duration: 2800,
      iconTheme: {
        primary: darkMode ? "#10b981" : "#059669",
        secondary: darkMode ? "#052e2b" : "#ecfdf5",
      },
    },
    error: {
      duration: 4200,
      iconTheme: {
        primary: darkMode ? "#f87171" : "#dc2626",
        secondary: darkMode ? "#450a0a" : "#fef2f2",
      },
    },
  };
}

type DefaultToastOptions = ToastOptions & {
  success?: ToastOptions;
  error?: ToastOptions;
};
