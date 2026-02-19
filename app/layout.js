export const metadata = {
  title: "Stellar Ramp Economics Calculator",
  description:
    "Interactive simulation comparing Traditional vs Stellar-optimized on/off-ramp unit economics, risk profiles, and profitability",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
