import "./globals.css";

export const metadata = {
  title: "Shorts Agency OS",
  description: "Lead finder, AI scorer, outreach writer, CRM pipeline, and follow-up engine for Shorts agencies."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
