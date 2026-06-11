"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { DEFAULT_NETWORK, NETWORKS, type Network } from "@/lib/config";

const NetworkCtx = createContext<{ network: Network; setNetwork: (n: Network) => void }>({
  network: DEFAULT_NETWORK, setNetwork: () => {},
});
export const useNetwork = () => useContext(NetworkCtx);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>(DEFAULT_NETWORK);
  const endpoint = NETWORKS[network];
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <NetworkCtx.Provider value={{ network, setNetwork }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </NetworkCtx.Provider>
  );
}
