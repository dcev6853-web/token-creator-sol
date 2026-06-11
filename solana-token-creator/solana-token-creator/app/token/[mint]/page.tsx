"use client";

// Auto-generated token page: reads mint + metadata straight from chain.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { findMetadataPda } from "@/lib/metadata";
import { explorerUrl } from "@/lib/config";
import { useNetwork } from "@/app/providers";
import Header from "@/components/Header";

function readBorshStr(buf: Buffer, offset: number): [string, number] {
  const len = buf.readUInt32LE(offset);
  return [buf.subarray(offset + 4, offset + 4 + len).toString("utf8").replace(/\0+$/, ""), offset + 4 + len];
}

export default function TokenPage() {
  const { mint } = useParams<{ mint: string }>();
  const { connection } = useConnection();
  const { network } = useNetwork();
  const [data, setData] = useState<{ name?: string; symbol?: string; uri?: string; supply?: string; decimals?: number; image?: string; description?: string } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const mintPk = new PublicKey(mint);
        const supplyInfo = await connection.getTokenSupply(mintPk);
        const out: any = { supply: supplyInfo.value.uiAmountString, decimals: supplyInfo.value.decimals };

        const metaAcc = await connection.getAccountInfo(findMetadataPda(mintPk));
        if (metaAcc) {
          const buf = Buffer.from(metaAcc.data);
          let o = 1 + 32 + 32; // key + updateAuthority + mint
          let name, symbol, uri;
          [name, o] = readBorshStr(buf, o);
          [symbol, o] = readBorshStr(buf, o);
          [uri, o] = readBorshStr(buf, o);
          Object.assign(out, { name, symbol, uri });
          if (uri) {
            try {
              const j = await fetch(uri).then((r) => r.json());
              out.image = j.image; out.description = j.description;
            } catch {}
          }
        }
        setData(out);
      } catch (e: any) { setErr(e?.message || "Token not found."); }
    })();
  }, [mint, connection]);

  return (
    <main>
      <Header />
      <section className="mx-auto mt-16 max-w-xl px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          {err && <p className="text-sm text-red-600">{err}</p>}
          {!data && !err && <p className="text-sm text-gray-500">Loading token…</p>}
          {data && (
            <>
              {data.image && <img src={data.image} alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />}
              <h1 className="mt-4 text-2xl font-bold">{data.name || "Unknown token"} {data.symbol && <span className="text-gray-400">({data.symbol})</span>}</h1>
              {data.description && <p className="mt-2 text-sm text-gray-600">{data.description}</p>}
              <p className="mt-4 text-sm">Total supply: <b>{data.supply}</b> · Decimals: <b>{data.decimals}</b></p>
              <p className="mt-2 break-all font-mono text-xs text-gray-500">{mint}</p>
              <a className="mt-4 inline-block rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white" target="_blank"
                href={explorerUrl(mint, "address", network)}>View on Solscan ↗</a>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
