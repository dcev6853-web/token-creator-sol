"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { fetchUserTokens, type OwnedToken } from "@/lib/createToken";
import { explorerUrl } from "@/lib/config";
import { useNetwork } from "@/app/providers";

export default function TokenList() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { network } = useNetwork();
  const [tokens, setTokens] = useState<OwnedToken[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setTokens([]); return; }
    setLoading(true);
    fetchUserTokens(connection, publicKey)
      .then(setTokens).catch(() => setTokens([])).finally(() => setLoading(false));
  }, [publicKey, connection]);

  if (!publicKey) return null;

  return (
    <section className="mx-auto mt-10 max-w-2xl px-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-semibold">Your tokens</h3>
        {loading && <p className="hint">Loading…</p>}
        {!loading && tokens.length === 0 && <p className="hint">No tokens found in this wallet.</p>}
        <ul className="mt-3 divide-y divide-gray-100">
          {tokens.map((t) => (
            <li key={t.mint} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="break-all font-mono text-xs">{t.mint}</span>
              <span className="shrink-0 font-semibold">{t.amount}</span>
              <a className="shrink-0 text-brand underline" target="_blank" href={explorerUrl(t.mint, "address", network)}>Explorer ↗</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
