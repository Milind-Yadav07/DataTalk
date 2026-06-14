import type { Metadata } from "next";
import "./globals.css";
import Providers from "../components/layout/Providers";

export const metadata: Metadata = {
  title: "DataTalk - Natural Language to Data Visualization",
  description: "Translate natural language questions about datasets into structured interactive data visualizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
