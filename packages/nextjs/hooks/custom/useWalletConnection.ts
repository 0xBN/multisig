import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

const useWalletConnection = (signers: string[]) => {
  const [isConnectedWalletAdded, setIsConnectedWalletAdded] = useState(false);

  const { address: connectedWallet } = useAccount();

  useEffect(() => {
    setIsConnectedWalletAdded(signers.includes(connectedWallet || ""));
  }, [signers, connectedWallet]);

  return { isConnectedWalletAdded };
};

export default useWalletConnection;
