import "./globals.css";

export const metadata = {
  title: "KMForge — Manufacturing Cloud",
  description: "Sales, production, purchasing and inventory for your factory. By KMatrix AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
