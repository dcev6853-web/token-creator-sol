"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Keypair } from "@solana/web3.js";
import { createToken, estimateCostSol, grindVanity } from "@/lib/createToken";
import { BASE_FEE_SOL, OPTION_FEE_SOL, explorerUrl } from "@/lib/config";
import { useNetwork } from "@/app/providers";

const SUGGESTED_TAGS = ["Meme", "Airdrop", "Tokenization", "NFT"];

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return <button type="button" className="toggle" data-on={on} onClick={() => set(!on)} aria-pressed={on} />;
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900">
      <span className="font-semibold text-amber-600">Recommend!</span> {children}
    </div>
  );
}

function OptionRow(props: {
  title: string; desc: string; on: boolean; set: (v: boolean) => void;
  isNew?: boolean; fee?: number;
}) {
  return (
    <div className="border-t border-gray-100 py-4">
      <div className="flex items-center gap-3">
        <Toggle on={props.on} set={props.set} />
        <span className="text-sm font-semibold">{props.title}</span>
        {props.isNew && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">New</span>}
        {props.fee !== undefined && (
          <span className="ml-auto text-xs font-semibold text-brand">Fee: {props.fee} SOL</span>
        )}
      </div>
      <p className="hint">{props.desc}</p>
    </div>
  );
}

export default function TokenForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { network } = useNetwork();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [logoMode, setLogoMode] = useState<"file" | "url">("file");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const [revokeMint, setRevokeMint] = useState(false);
  const [revokeFreeze, setRevokeFreeze] = useState(false);
  const [customCreator, setCustomCreator] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [creatorSite, setCreatorSite] = useState("");
  const [immutable, setImmutable] = useState(false);

  const [vanityOn, setVanityOn] = useState(false);
  const [vanityPrefix, setVanityPrefix] = useState("");
  const [vanityStatus, setVanityStatus] = useState("");
  const vanityStop = useRef(false);
  const [vanityKp, setVanityKp] = useState<Keypair | null>(null);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ mint: string; signature: string } | null>(null);
  const [estCost, setEstCost] = useState<number | null>(null);

  const optionCount = [revokeMint, revokeFreeze, immutable].filter(Boolean).length;
  const platformFee = BASE_FEE_SOL + optionCount * OPTION_FEE_SOL;

  useEffect(() => {
    estimateCostSol(connection, optionCount).then(setEstCost).catch(() => setEstCost(null));
  }, [connection, optionCount]);

  const addTag = (t: string) => {
    const v = t.trim();
    if (v && tags.length < 3 && !tags.includes(v)) setTags([...tags, v]);
    setTagInput("");
  };

  const startVanity = useCallback(async () => {
    if (!vanityPrefix) return;
    vanityStop.current = false;
    setVanityKp(null);
    setVanityStatus("Grinding…");
    const kp = await grindVanity(
      vanityPrefix,
      (n) => setVanityStatus(`Grinding… ${n.toLocaleString()} attempts`),
      () => vanityStop.current
    );
    if (kp) { setVanityKp(kp); setVanityStatus(`Found: ${kp.publicKey.toBase58()}`); }
    else setVanityStatus("Stopped.");
  }, [vanityPrefix]);

  const handleCreate = async () => {
    setError(""); setResult(null);
    if (!wallet.connected) return setError("Connect your wallet first.");
    if (!name.trim()) return setError("Token name is required.");
    if (name.length > 30) return setError("Token name: max 30 characters.");
    if (!symbol.trim()) return setError("Token symbol is required.");
    if (symbol.length > 10) return setError("Token symbol: max 10 characters.");
    const supplyDigits = supply.replace(/[\s,]/g, "");
    if (!/^\d+$/.test(supplyDigits) || BigInt(supplyDigits) === 0n) return setError("Supply must be a positive whole number.");
    if (decimals < 0 || decimals > 9) return setError("Decimals must be 0–9.");
    if (vanityOn && !vanityKp) return setError("Custom address enabled — grind an address first or turn it off.");

    setLoading(true);
    try {
      // 1) Build metadata URI
      let uri = "";
      if (logoMode === "url" && logoUrl) uri = "";
      if (logoFile || logoUrl || description || customCreator) {
        setStatus("Uploading metadata…");
        const fd = new FormData();
        fd.append("name", name); fd.append("symbol", symbol);
        fd.append("description", description); fd.append("tags", tags.join(","));
        if (customCreator) { fd.append("creatorName", creatorName); fd.append("creatorSite", creatorSite); }
        if (logoMode === "file" && logoFile) fd.append("file", logoFile);
        if (logoMode === "url" && logoUrl) fd.append("imageUrl", logoUrl);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) {
          // Fallback: if uploads aren't configured but a direct URL was given, use it as the URI.
          if (logoMode === "url" && logoUrl) uri = logoUrl;
          else throw new Error(j.error || "Metadata upload failed.");
        } else uri = j.uri;
      }

      // 2) Build + send the on-chain transaction (signed by the user's wallet)
      const res = await createToken(connection, wallet, {
        name, symbol, decimals,
        supply: BigInt(supplyDigits),
        uri, revokeMint, revokeFreeze, immutable,
        mintKeypair: vanityOn ? vanityKp ?? undefined : undefined,
      }, setStatus);

      setResult({ mint: res.mint, signature: res.signature });
      setStatus("");
    } catch (e: any) {
      const msg: string = e?.message || "Failed to create token.";
      setError(/insufficient|0x1\b/i.test(msg) ? "Insufficient SOL balance to cover on-chain costs." : msg);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-2xl px-4">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-xl text-white">✦</div>
      <h1 className="mt-4 text-center text-3xl font-bold">Solana Token Creator</h1>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-gray-500">
        Easily create and mint your own SPL Token without coding. Customize with metadata, supply, and add logo.
        Try it out for free on Solana devnet.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h2 className="border-b border-gray-100 pb-4 text-center font-semibold">Token information</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Token Name (Max 30) <span className="text-red-500">*</span></label>
            <input className="input" placeholder="My awesome token" maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Token Symbol (Max 10) <span className="text-red-500">*</span></label>
            <input className="input" placeholder="AWESOME" maxLength={10} value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Decimals <span className="text-red-500">*</span></label>
          <input className="input" type="number" min={0} max={9} value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} />
          <p className="hint">Change the number of decimals for your token</p>
        </div>

        <div className="mt-4">
          <label className="label">Supply <span className="text-red-500">*</span></label>
          <input className="input" inputMode="numeric" value={supply} onChange={(e) => setSupply(e.target.value)} />
          <p className="hint">The initial number of available tokens that will be created in your wallet</p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="label !mb-0">Logo</label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <Toggle on={logoMode === "url"} set={(v) => setLogoMode(v ? "url" : "file")} /> Enter logo url
            </label>
          </div>
          <p className="hint !mt-0 mb-2">Add logo for your token</p>
          {logoMode === "file" ? (
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl bg-[#F1F1F3] text-2xl text-gray-400 hover:bg-gray-200">
              {logoFile ? "✓" : "⇪"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </label>
          ) : (
            <input className="input" placeholder="https://…/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          )}
          {logoMode === "file" && logoFile && <p className="hint">{logoFile.name}</p>}
        </div>

        <div className="mt-4">
          <label className="label">Description</label>
          <textarea className="input min-h-24" placeholder="Here you can briefly describe your token" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="mt-4">
          <label className="label">Tags (optional)</label>
          <p className="hint !mt-0 mb-2">Select tags that are most associated with your project – max 3 tags</p>
          <input className="input" placeholder="Enter tag" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(tagInput))} />
          <div className="mt-2 flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((t) => (
              <button key={t} type="button" onClick={() => (tags.includes(t) ? setTags(tags.filter((x) => x !== t)) : addTag(t))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tags.includes(t) ? "bg-brand text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
                {t}
              </button>
            ))}
            {tags.filter((t) => !SUGGESTED_TAGS.includes(t)).map((t) => (
              <button key={t} type="button" onClick={() => setTags(tags.filter((x) => x !== t))}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">{t} ×</button>
            ))}
          </div>
        </div>

        <h3 className="mt-8 flex items-center gap-2 font-semibold">⚙ Additional settings</h3>
        <div className="mt-2">
          <OptionRow title="Revoke Mint Authority" fee={OPTION_FEE_SOL} on={revokeMint} set={setRevokeMint}
            desc="Prevent additional token supply to increase investors trust." />
          {revokeMint && <Banner>Revoke right to mint new coins, this shows buyer of your coin that supply is fixed and cannot grow. DEX scanners will mark your coin as safe.</Banner>}

          <OptionRow title="Revoke Freeze Authority" fee={OPTION_FEE_SOL} on={revokeFreeze} set={setRevokeFreeze}
            desc="Prevent token accounts from being frozen." />
          {revokeFreeze && <Banner>Revoke freeze right, you will make coin safer for potential buyers of your coin and get more sales. DEX scanners will mark your coin as safe.</Banner>}

          <OptionRow title="Custom Creator Info" isNew fee={OPTION_FEE_SOL} on={customCreator} set={setCustomCreator}
            desc="Change information about token creator in token metadata" />
          {customCreator && (
            <div className="grid gap-3 pb-2 sm:grid-cols-2">
              <input className="input" placeholder="Creator name" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} />
              <input className="input" placeholder="Creator website" value={creatorSite} onChange={(e) => setCreatorSite(e.target.value)} />
            </div>
          )}

          <OptionRow title="Immutable" on={immutable} set={setImmutable}
            desc="If your token is immutable it means you will not be able to update token metadata" />
        </div>

        <h3 className="mt-6 flex items-center gap-2 font-semibold">⊕ Personalization</h3>
        <div className="mt-2">
          <OptionRow title="Claim a Custom Address" isNew fee={OPTION_FEE_SOL} on={vanityOn} set={(v) => { setVanityOn(v); vanityStop.current = true; }}
            desc="Personalize your token contract address by customizing the beginning — stand out with a unique touch!" />
          {vanityOn && (
            <div className="pb-2">
              <div className="flex gap-2">
                <input className="input" placeholder="Prefix (1–4 chars, base58)" maxLength={4} value={vanityPrefix}
                  onChange={(e) => setVanityPrefix(e.target.value.replace(/[^1-9A-HJ-NP-Za-km-z]/g, ""))} />
                <button type="button" onClick={startVanity} className="rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white">Grind</button>
                <button type="button" onClick={() => (vanityStop.current = true)} className="rounded-lg bg-gray-200 px-4 text-sm font-semibold">Stop</button>
              </div>
              <p className="hint break-all">{vanityStatus || "3+ characters can take minutes in-browser."}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Create Token Page</span>
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">New</span>
            </div>
            <span className="text-xs font-semibold text-brand">Auto-created at /token/&lt;mint&gt; ↗</span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {status && <p className="mt-4 rounded-lg bg-violet-50 px-4 py-3 text-sm text-brand">{status}</p>}
        {result && (
          <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold">Token created 🎉</p>
            <p className="break-all">Mint: {result.mint}</p>
            <p className="mt-1 flex gap-4">
              <a className="underline" target="_blank" href={explorerUrl(result.mint, "address", network)}>View on Solscan</a>
              <a className="underline" target="_blank" href={explorerUrl(result.signature, "tx", network)}>Transaction</a>
              <a className="underline" href={`/token/${result.mint}`}>Token page</a>
            </p>
          </div>
        )}

        <button onClick={handleCreate} disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand py-3.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {loading ? "Creating…" : wallet.connected ? "Create token" : "Connect wallet to create"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-500">
          Service fee: <span className="font-semibold text-brand">{platformFee} SOL</span>
          {estCost !== null && <> · Estimated total on-chain cost: ~{estCost.toFixed(4)} SOL ({network})</>}
        </p>
      </div>
    </section>
  );
}
