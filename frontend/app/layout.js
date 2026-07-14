import "./globals.css";

export const metadata = {
  title: "MixerWorks — Manufacturing Cloud",
  description: "Sales, production, purchasing and inventory for your factory.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
