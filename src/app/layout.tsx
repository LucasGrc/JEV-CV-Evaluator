import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "CV Evaluator Enterprise | TypeSafe AI (JEV)",
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
        <Navigation />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
