import React from "react";

export const metadata = {
  title: "ApexDrop Store",
  description: "Next.js Dropshipping Store Front",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
