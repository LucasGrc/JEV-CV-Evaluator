import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV Evaluator | TypeSafe AI (JEV) Technical Demo",
  description:
    "Evaluador inteligente de Currículums con extracción tipada y determinista usando JEV de TypeSafe AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
