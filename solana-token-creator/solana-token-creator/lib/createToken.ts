import {
  Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction,
} from "@solana/web3.js";
import {
  AuthorityType, MINT_SIZE, TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction, createInitializeMint2Instruction,
  createMintToInstruction, createSetAuthorityInstruction,
  getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import { createMetadataV3Ix } from "./metadata";
import { BASE_FEE_SOL, FEE_WALLET, OPTION_FEE_SOL } from "./config";

export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  supply: bigint;        // whole tokens (no decimals applied)
  uri: string;           // off-chain metadata JSON uri ("" allowed)
  revokeMint: boolean;
  revokeFreeze: boolean;
  immutable: boolean;
  mintKeypair?: Keypair; // pass a vanity-ground keypair to claim a custom address
}

const U64_MAX = 2n ** 64n - 1n;

export async function estimateCostSol(connection: Connection, optionCount: number): Promise<number> {
  const rent = await getMinimumBalanceForRentExemptMint(connection);
  const ataRent = await connection.getMinimumBalanceForRentExemption(165);
  const metaRent = await connection.getMinimumBalanceForRentExemption(607); // typical metadata account size
  const txFee = 5000 * 3; // generous estimate for signatures
  const platform = (BASE_FEE_SOL + optionCount * OPTION_FEE_SOL) * LAMPORTS_PER_SOL;
  return (rent + ataRent + metaRent + txFee + platform) / LAMPORTS_PER_SOL;
}

export async function createToken(
  connection: Connection,
  wallet: WalletContextState,
  p: CreateTokenParams,
  onStatus?: (s: string) => void
): Promise<{ mint: string; ata: string; signature: string }> {
  if (!wallet.publicKey || !wallet.sendTransaction) throw new Error("Connect your wallet first.");
  const owner = wallet.publicKey;

  const rawAmount = p.supply * 10n ** BigInt(p.decimals);
  if (rawAmount > U64_MAX) throw new Error("Supply × 10^decimals exceeds the u64 limit. Lower supply or decimals.");

  onStatus?.("Preparing transaction…");
  const mintKeypair = p.mintKeypair ?? Keypair.generate();
  const mint = mintKeypair.publicKey;
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  const ata = getAssociatedTokenAddressSync(mint, owner);

  const tx = new Transaction();

  tx.add(
    SystemProgram.createAccount({
      fromPubkey: owner, newAccountPubkey: mint, space: MINT_SIZE,
      lamports, programId: TOKEN_PROGRAM_ID,
    }),
    // Freeze authority: null right away when "Revoke Freeze Authority" is on.
    createInitializeMint2Instruction(mint, p.decimals, owner, p.revokeFreeze ? null : owner),
    createMetadataV3Ix({
      mint, mintAuthority: owner, payer: owner, updateAuthority: owner,
      name: p.name, symbol: p.symbol, uri: p.uri, isMutable: !p.immutable,
    }),
    createAssociatedTokenAccountInstruction(owner, ata, owner, mint),
    createMintToInstruction(mint, ata, owner, rawAmount)
  );

  if (p.revokeMint) tx.add(createSetAuthorityInstruction(mint, owner, AuthorityType.MintTokens, null));

  // Optional platform fee — defaults to 0 so the user pays exactly the on-chain cost.
  const optionCount = [p.revokeMint, p.revokeFreeze, p.immutable].filter(Boolean).length;
  const feeSol = BASE_FEE_SOL + optionCount * OPTION_FEE_SOL;
  if (feeSol > 0 && FEE_WALLET) {
    tx.add(SystemProgram.transfer({
      fromPubkey: owner, toPubkey: new PublicKey(FEE_WALLET),
      lamports: Math.round(feeSol * LAMPORTS_PER_SOL),
    }));
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner;

  onStatus?.("Waiting for wallet signature…");
  const signature = await wallet.sendTransaction(tx, connection, { signers: [mintKeypair] });

  onStatus?.("Confirming transaction…");
  const conf = await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight }, "confirmed"
  );
  if (conf.value.err) throw new Error(`Transaction failed: ${JSON.stringify(conf.value.err)}`);

  return { mint: mint.toBase58(), ata: ata.toBase58(), signature };
}

export interface OwnedToken { mint: string; amount: string; decimals: number }

export async function fetchUserTokens(connection: Connection, owner: PublicKey): Promise<OwnedToken[]> {
  const res = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });
  return res.value
    .map((a) => {
      const info = a.account.data.parsed.info;
      return { mint: info.mint as string, amount: info.tokenAmount.uiAmountString as string, decimals: info.tokenAmount.decimals as number };
    })
    .filter((t) => Number(t.amount) > 0);
}

// Vanity ("Claim a Custom Address") — grinds a keypair whose base58 address starts with `prefix`.
export async function grindVanity(
  prefix: string,
  onProgress: (attempts: number) => void,
  shouldStop: () => boolean
): Promise<Keypair | null> {
  let attempts = 0;
  const target = prefix;
  // Yield to the UI thread every batch.
  while (!shouldStop()) {
    for (let i = 0; i < 2000; i++) {
      const kp = Keypair.generate();
      attempts++;
      if (kp.publicKey.toBase58().startsWith(target)) return kp;
    }
    onProgress(attempts);
    await new Promise((r) => setTimeout(r, 0));
  }
  return null;
}
