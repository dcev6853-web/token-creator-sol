export const NETWORKS = {
  mainnet: process.env.NEXT_PUBLIC_RPC_MAINNET || "https://api.mainnet-beta.solana.com",
  devnet: process.env.NEXT_PUBLIC_RPC_DEVNET || "https://api.devnet.solana.com",
} as const;
export type Network = keyof typeof NETWORKS;
export const DEFAULT_NETWORK: Network =
  (process.env.NEXT_PUBLIC_DEFAULT_NETWORK as Network) || "mainnet";

export const BASE_FEE_SOL = Number(process.env.NEXT_PUBLIC_BASE_FEE_SOL || 0);
export const OPTION_FEE_SOL = Number(process.env.NEXT_PUBLIC_OPTION_FEE_SOL || 0);
export const FEE_WALLET = process.env.NEXT_PUBLIC_FEE_WALLET || "";

export const explorerUrl = (sigOrAddr: string, type: "tx" | "address", network: Network) =>
  `https://solscan.io/${type === "tx" ? "tx" : "token"}/${sigOrAddr}${network === "devnet" ? "?cluster=devnet" : ""}`;
