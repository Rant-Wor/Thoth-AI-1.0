import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thoth AI by INT",
  description: "Thoth ☾✧ — ระบบถาม-ตอบอัจฉริยะ by INT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full" id="app-body">
        {children}
      </body>
    </html>
  );
}
