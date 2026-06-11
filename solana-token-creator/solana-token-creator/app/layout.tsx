import type { Metadata } from "next";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Solana Token Creator — create and mint SPL tokens without coding",
  description: "Create SPL tokens on Solana mainnet. Customize metadata, supply, logo. No custody, you pay only on-chain costs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
