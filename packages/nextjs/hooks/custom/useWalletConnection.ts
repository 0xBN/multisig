import { useEffect, useState } from "react";
import { useAccount, useNetwork } from "wagmi";
import { useGlobalState } from "~~/services/store/store";

const useWalletConnection = (signers: string[]) => {
  const [isConnectedWalletAdded, setIsConnectedWalletAdded] = useState(false);
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  const network = useNetwork();
  const { address: connectedWallet } = useAccount();

  useEffect(() => {
    if (network.chain) {
      setChainId(network.chain.id);
    }

    setIsConnectedWalletAdded(signers.includes(connectedWallet || ""));
  }, [network.chain, signers, connectedWallet]);

  return { isConnectedWalletAdded, chainId, connectedWallet };
};

export default useWalletConnection;
