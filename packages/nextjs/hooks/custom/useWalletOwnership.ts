import { useEffect, useState } from "react";
import { fetchMultisigWalletData } from "~~/services/firebaseService";
import { MultisigWallet } from "~~/types/multisigWallet";

const useWalletOwnership = (address: string | undefined, userAddress: string | undefined) => {
  const [isWalletOwner, setIsWalletOwner] = useState(false);
  const [walletData, setWalletData] = useState<MultisigWallet | null>(null);

  useEffect(() => {
    const checkIfWalletOwner = async () => {
      if (!address || !userAddress) return;
      try {
        const data = await fetchMultisigWalletData(address);
        if (data && data.signers.includes(userAddress)) {
          setIsWalletOwner(true);
          setWalletData(data as MultisigWallet);
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
    };
    checkIfWalletOwner();
  }, [address, userAddress]);

  return { isWalletOwner, walletData };
};

export default useWalletOwnership;
