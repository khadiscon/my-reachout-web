import "./globals.css";

export const metadata = {
  title: "Shorts Agency OS — AI outreach for short-form agencies",
  description: "Find leads, score them with AI, generate DMs that actually get replies, and close deals — all in one workspace built for short-form content agencies.",
  keywords: ["shorts agency", "content agency CRM", "AI outreach", "short-form video", "lead generation"],
  authors: [{ name: "Shorts Agency OS" }],
  openGraph: {
    title: "Shorts Agency OS",
    description: "AI-powered lead finder, scorer, and outreach writer for short-form content agencies.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shorts Agency OS",
    description: "AI-powered lead finder, scorer, and outreach writer for short-form content agencies.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060606",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
