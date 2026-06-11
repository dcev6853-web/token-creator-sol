"use client";

const tools = [
  ["Solana Token Generator", "/"],
  ["Solana Multisender", "#"],
  ["Revoke Freeze Authority", "#"],
  ["Revoke Mint Authority", "#"],
  ["Update Token Metadata", "#"],
  ["Create OpenBook Market", "#"],
  ["Make Immutable", "#"],
  ["Create Token Page", "#"],
  ["Mint Tokens", "#"],
  ["Burn Tokens", "#"],
  ["Create Liquidity Pool", "#"],
  ["Manage Liquidity", "#"],
  ["Freeze Accounts", "#"],
  ["Unfreeze Accounts", "#"],
] as const;

export default function ToolsHero() {
  return (
    <section id="tools" className="mx-auto mt-10 max-w-2xl px-4">
      <div className="rounded-3xl bg-[radial-gradient(ellipse_at_top,#0e3b2e,#04110d_70%)] p-6 text-white shadow-xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 text-2xl font-black">S</div>
        <h2 className="text-center text-2xl font-bold">Solana Manager</h2>
        <p className="mt-1 text-center text-sm text-white/70">
          Easily create and manage your Solana SPL tokens online without coding
        </p>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tools.map(([name, href], i) => (
            <a key={name} href={href}
              className={`flex items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium transition ${i === 0 ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`}>
              {name}
              {i !== 0 && <span aria-hidden>↗</span>}
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-sm font-semibold text-amber-300">Start earning revenue in SOL</p>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-full bg-white/10 px-4 py-2.5 text-sm">
          <span>Connect your wallet to generate the referral link</span>
          <button className="rounded-full bg-white/20 px-4 py-1.5 font-semibold hover:bg-white/30">Copy</button>
        </div>
        <p className="mt-3 text-center text-xs text-white/50">
          You will get a revenue of 30% from the token creation fee. Earnings will be automatically sent to your SOL wallet at the moment of token creation.
        </p>
      </div>
    </section>
  );
}
