import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mary's Kitchen",
  description: "Refeições vegetarianas semanais, feitas no Porto.",
  icons: {
    icon: "/images/logo-marys-kitchen.png",
    shortcut: "/images/logo-marys-kitchen.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
