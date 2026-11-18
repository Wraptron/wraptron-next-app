import localFont from "next/font/local";

/** Shared Open Sans (variable) — used by quote preview and requirements PDF. */
export const openSans = localFont({
  src: [
    {
      path: "./OpenSans-Variable.ttf",
      weight: "300 800",
      style: "normal",
    },
    {
      path: "./OpenSans-Italic-Variable.ttf",
      weight: "300 800",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-open-sans",
});
