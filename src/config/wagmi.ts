import { cookieStorage, createStorage, http } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { AppKitNetwork, bsc, bscTestnet } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
// export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

export const projectId = "0268bdf2515ec528e27d6e1b8ee87e88";

if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const networks = [bsc, bscTestnet] as [AppKitNetwork, ...AppKitNetwork[]];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [bsc.id]:        http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
    [bscTestnet.id]: http(process.env.NEXT_PUBLIC_BSC_RPC_URL)
  },
});

export const config = wagmiAdapter.wagmiConfig;
