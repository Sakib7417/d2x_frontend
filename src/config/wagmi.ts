"use client";

import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { AppKitNetwork, bsc, bscTestnet } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "0268bdf2515ec528e27d6e1b8ee87e88";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

const isTestnet = process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === "bsc-testnet";

export const networks = (isTestnet ? [bscTestnet] : [bsc]) as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

export const defaultNetwork = isTestnet ? bscTestnet : bsc;

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [defaultNetwork.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
  },
});

export const config = wagmiAdapter.wagmiConfig;
