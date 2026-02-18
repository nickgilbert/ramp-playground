export const metadata = {
  title: "Ramp Economics Playground",
  description:
    "Compare on/off-ramp economics: Traditional MXN→USDC vs Stellar-optimized MXN→CETES→USDC path",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
