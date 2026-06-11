"use client";

import { useState } from "react";

const items: [string, string][] = [
  ["What is Solana Token Creator?", "A no-code tool that builds and sends a real SPL token creation transaction from your own wallet. The mint, supply and authorities all belong to you — the platform never holds keys or funds."],
  ["What is SPL token?", "SPL is Solana's token standard (the equivalent of ERC-20 on Ethereum). Every fungible token on Solana — USDC, BONK, etc. — is an SPL token managed by the Token Program."],
  ["What wallets can I use to create and mint SPL tokens?", "Phantom and Solflare are supported out of the box via the Solana Wallet Adapter."],
  ["How much does it cost to create SPL tokens?", "You pay only the on-chain cost: rent-exemption for the mint account, token account and metadata account, plus network transaction fees — roughly 0.01–0.02 SOL total. This platform adds no markup by default."],
  ["How to use Solana Token Creator?", "Connect your wallet, fill in name, symbol, decimals and supply, optionally add a logo and description, choose authority options, then press Create token and approve the transaction in your wallet."],
  ["Can I try Solana Token Generator for free?", "Yes — switch the network selector to Devnet, airdrop yourself test SOL, and create tokens at no real cost."],
  ["Can I create meme coin on Solana via your tool?", "Yes. Set your name, symbol and supply, upload a logo, and consider revoking mint and freeze authority — DEX scanners mark such tokens as safer for buyers."],
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="mx-auto mt-16 max-w-2xl px-4">
      <h2 className="text-center text-2xl font-bold">FAQ</h2>
      <div className="mx-auto mt-1 h-1 w-10 rounded bg-brand" />
      <div className="mt-6 space-y-3">
        {items.map(([q, a], i) => (
          <div key={q} className="rounded-xl bg-gray-100">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold">
              {q}<span className="text-gray-500">{open === i ? "˄" : "˅"}</span>
            </button>
            {open === i && <p className="px-5 pb-4 text-sm text-gray-600">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
