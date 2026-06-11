"use client";

import dynamic from "next/dynamic";
import { useNetwork } from "@/app/providers";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false }
);

export default function Header() {
  const { network, setNetwork } = useNetwork();
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
          Coin Factory
        </a>
        <div className="hidden flex-1 md:block">
          <input className="input !py-2 max-w-xs" placeholder="Search for tokens, tools or articles" />
        </div>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          <a href="/" className="hover:text-brand">Create token</a>
          <a href="#tools" className="hover:text-brand">Tools</a>
          <a href="#faq" className="hover:text-brand">Blog</a>
        </nav>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as any)}
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold"
          title="Network"
        >
          <option value="mainnet">Mainnet</option>
          <option value="devnet">Devnet</option>
        </select>
        <WalletMultiButton />
      </div>
    </header>
  );
}
