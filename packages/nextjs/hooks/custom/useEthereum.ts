import { useEffect, useState } from "react";
import { ethers } from "ethers";

const useEthereum = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(web3Provider);
      web3Provider.getSigner().then(setSigner);
    }
  }, []);

  return { provider, signer };
};

export default useEthereum;
