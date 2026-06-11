# Solana Token Creator

No-code SPL token generator (Coin Factory–style UI). Non-custodial: every transaction is built client-side and signed by the user's wallet. By default there is **no platform fee** — users pay only mint-account rent, ATA rent, metadata rent and network fees (~0.01–0.02 SOL).

## Features
- Phantom / Solflare via Solana Wallet Adapter, mainnet/devnet switch
- Create SPL mint + ATA + initial supply in one transaction
- On-chain Metaplex metadata (name, symbol, URI) — hand-rolled CreateMetadataAccountV3 ix, no umi dependency
- Toggles: Revoke Mint Authority, Revoke Freeze Authority, Immutable metadata, Custom Creator Info
- Logo upload + metadata JSON pinned to IPFS via Pinata (optional, `PINATA_JWT`), or direct logo URL
- Claim a Custom Address: in-browser vanity prefix grinding
- Auto token page at `/token/<mint>` reading metadata from chain
- "Your tokens" dashboard, live cost estimate, Solscan links
- Optional platform fee via env (defaults to 0)

## Setup
```bash
npm install
cp .env.example .env.local   # set a real mainnet RPC (Helius/QuickNode) — public RPC rate-limits
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```
Deploy anywhere Next.js runs (Vercel: import repo, add env vars, deploy).

## Mainnet checklist
- Set `NEXT_PUBLIC_RPC_MAINNET` to a paid/dedicated RPC endpoint
- Test the full flow on **devnet** first (network selector in header)
- Set `PINATA_JWT` if you want logo uploads; otherwise users paste an image URL
- To charge fees: set `NEXT_PUBLIC_BASE_FEE_SOL`, `NEXT_PUBLIC_OPTION_FEE_SOL`, `NEXT_PUBLIC_FEE_WALLET`

## Security model
- No private keys ever touch the server; the only server code is the optional IPFS pin route
- The wallet shows the exact transaction before signing
- Supply is validated against u64 overflow; errors (insufficient balance, failed tx) surface in the UI
